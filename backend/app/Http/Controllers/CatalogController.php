<?php

namespace App\Http\Controllers;

use App\Support\ProductImageProcessor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CatalogController extends Controller
{
    private function qArray(Request $request, string $key): array
    {
        $out = [];

        $raw = (string)($request->server('QUERY_STRING') ?? '');
        if ($raw === '') {
            $raw = (string)($request->getQueryString() ?? '');
        }

        if ($raw !== '') {
            foreach ([$key, $key . '[]'] as $k) {
                $pattern = '/(?:^|&)' . preg_quote($k, '/') . '=([^&]*)/i';
                if (preg_match_all($pattern, $raw, $m) && !empty($m[1])) {
                    foreach ($m[1] as $v) $out[] = urldecode($v);
                }
            }
        }

        $v = $request->query($key, null);
        if (is_array($v)) {
            foreach ($v as $x) $out[] = $x;
        } elseif ($v !== null && $v !== '') {
            $out[] = $v;
        }

        $out = array_map('strval', $out);
        $out = array_map('trim', $out);
        $out = array_values(array_filter($out, fn ($x) => $x !== ''));
        $out = array_values(array_unique($out));

        return $out;
    }

    private function calcPercentOff(?int $old, ?int $cur): ?int
    {
        if ($old === null || $cur === null) return null;
        if ($old <= 0) return null;
        if ($cur >= $old) return null;
        $pct = (int)round((1 - ($cur / $old)) * 100);
        return $pct > 0 ? $pct : null;
    }

    /**
     * ✅ MP discount rules:
     * - if mp_discount_active = 1:
     *    - prefer fixed discount (mp_discount_fixed_rsd) if > 0
     *    - else percent discount (mp_discount_percent) if > 0
     * - clamp current >= 0
     */
    private function applyMpDiscount(int $regular, $active, $pct, $fixed): ?int
    {
        $isActive = false;
        if (is_bool($active)) $isActive = $active;
        elseif ($active !== null) $isActive = ((int)$active) === 1;

        if (!$isActive) return null;

        $fixedN = ($fixed !== null && is_numeric($fixed)) ? (int)$fixed : 0;
        if ($fixedN > 0) {
            $cur = $regular - $fixedN;
            return max(0, $cur);
        }

        $pctN = ($pct !== null && is_numeric($pct)) ? (float)$pct : 0.0;
        if ($pctN > 0) {
            $cur = (int)round($regular * (1.0 - ($pctN / 100.0)));
            return max(0, $cur);
        }

        return null;
    }

    // --------------------------
    // LISTING
    // --------------------------
    public function categoryProducts(Request $request, string $slug_path)
    {
        $category = DB::table('categories')
            ->where('slug_path', $slug_path)
            ->where('is_active', 1)
            ->first();

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        // Branch (descendants)
        $descendantIds = [];

        // 1) Primary: category_closure (if present)
        if (Schema::hasTable('category_closure')) {
            $descendantIds = DB::table('category_closure')
                ->where('ancestor_id', $category->id)
                ->pluck('descendant_id')
                ->all();
        }

        // ✅ IMPORTANT: always include self (some closure tables don't include self rows)
        $descendantIds = array_values(array_unique(array_merge([(int)$category->id], array_map('intval', $descendantIds))));

        // 2) Fallback: slug_path prefix (if closure missing / incomplete)
        if (count($descendantIds) <= 1) {
            $prefix = rtrim((string)$category->slug_path, '/');
            if ($prefix !== '') {
                $like = $prefix . '/%';
                $more = DB::table('categories')
                    ->where('is_active', 1)
                    ->where('slug_path', 'like', $like)
                    ->pluck('id')
                    ->all();

                $descendantIds = array_values(array_unique(array_merge($descendantIds, array_map('intval', $more))));
            }
        }

        if (empty($descendantIds)) $descendantIds = [(int)$category->id];

        // Base query: products in branch
        $base = DB::table('products')
            ->join('category_product', 'category_product.product_id', '=', 'products.id')
            ->whereIn('category_product.category_id', $descendantIds);

        // Pagination
        $page = max(1, (int)($request->query('page', 1)));
        $perPage = min(60, max(1, (int)($request->query('per_page', 24))));
        $offset = ($page - 1) * $perPage;

        // Price filters
        $min = $request->query('min');
        $max = $request->query('max');

        // Sort
        $sort = trim((string)$request->query('sort', ''));

        // Brand selection
        $brandSelected = $this->qArray($request, 'brand');

        $brandIdsSelected = [];
        if (!empty($brandSelected) && Schema::hasTable('brands') && Schema::hasColumn('products', 'brand_id')) {
            $slugs = array_values(array_filter($brandSelected, fn ($v) => !is_numeric($v)));
            $ids = array_values(array_filter($brandSelected, fn ($v) => is_numeric($v)));

            $qBrand = DB::table('brands')->select('id');

            $qBrand->where(function ($w) use ($slugs, $ids) {
                if (!empty($slugs) && Schema::hasColumn('brands', 'slug')) {
                    $w->whereIn('slug', $slugs);
                }
                if (!empty($ids)) {
                    if (!empty($slugs)) $w->orWhereIn('id', array_map('intval', $ids));
                    else $w->whereIn('id', array_map('intval', $ids));
                }
            });

            $brandIdsSelected = $qBrand->pluck('id')->all();
        }

        // Active attribute codes for this category
        $attributeCodes = $this->getActiveAttributeCodesForCategory((int)$category->id);

        // remove reserved
        $reserved = ['brand', 'min', 'max', 'sort', 'page', 'per_page'];
        $attributeCodes = array_values(array_filter($attributeCodes, fn ($c) => !in_array((string)$c, $reserved, true)));

        // Selected attribute facets from query (dynamic)
        $selected = []; // code => [values]
        foreach ($attributeCodes as $code) {
            $vals = $this->qArray($request, (string)$code);
            if (!empty($vals)) $selected[(string)$code] = $vals;
        }

        $applyAllFilters = function ($q, ?string $excludeCode = null) use ($selected, $min, $max, $brandIdsSelected) {
            // Price (filters on REGULAR price_rsd for now; can be extended later to discounted)
            if ($excludeCode !== 'price' && Schema::hasColumn('products', 'price_rsd')) {
                if ($min !== null && is_numeric($min)) $q->where('products.price_rsd', '>=', (int)$min);
                if ($max !== null && is_numeric($max)) $q->where('products.price_rsd', '<=', (int)$max);
            }

            // Brand
            if ($excludeCode !== 'brand' && !empty($brandIdsSelected) && Schema::hasColumn('products', 'brand_id')) {
                $q->whereIn('products.brand_id', $brandIdsSelected);
            }

            // Attribute facets
            if (Schema::hasTable('attributes') && Schema::hasTable('attribute_values') && Schema::hasTable('product_attribute_values')) {
                foreach ($selected as $code => $values) {
                    if ($excludeCode !== null && $code === $excludeCode) continue;

                    $q->whereExists(function ($sub) use ($code, $values) {
                        $sub->select(DB::raw(1))
                            ->from('product_attribute_values as pav')
                            ->join('attribute_values as av', 'av.id', '=', 'pav.attribute_value_id')
                            ->join('attributes as a', 'a.id', '=', 'av.attribute_id')
                            ->whereColumn('pav.product_id', 'products.id')
                            ->where('a.code', $code)
                            ->whereIn('av.value', $values);
                    });
                }
            }

            return $q;
        };

        // Products query (filtered)
        $q = clone $base;
        $q = $applyAllFilters($q);

        // SORT (still by regular price_rsd, consistent with existing behavior)
        if ($sort === 'cena_gore' && Schema::hasColumn('products', 'price_rsd')) {
            $q->orderBy('products.price_rsd', 'asc')->orderBy('products.id', 'desc');
        } elseif ($sort === 'cena_dole' && Schema::hasColumn('products', 'price_rsd')) {
            $q->orderBy('products.price_rsd', 'desc')->orderBy('products.id', 'desc');
        } elseif ($sort === 'najnovije') {
            if (Schema::hasColumn('products', 'created_at')) {
                $q->orderBy('products.created_at', 'desc')->orderBy('products.id', 'desc');
            } else {
                $q->orderBy('products.id', 'desc');
            }
        } else {
            $q->orderBy('products.id', 'desc');
        }

        // Total distinct products
        $total = (clone $q)->distinct('products.id')->count('products.id');

        // Products page rows
        $rows = (clone $q)
            ->select('products.*')
            ->distinct()
            ->offset($offset)
            ->limit($perPage)
            ->get();

        $nameCol = Schema::hasColumn('products', 'name') ? 'name' : (Schema::hasColumn('products', 'title') ? 'title' : null);
        $slugCol = Schema::hasColumn('products', 'slug') ? 'slug' : null;
        $priceCol = Schema::hasColumn('products', 'price_rsd') ? 'price_rsd' : (Schema::hasColumn('products', 'price') ? 'price' : null);
        $imgCol = Schema::hasColumn('products', 'image_grid_url') ? 'image_grid_url' : (Schema::hasColumn('products', 'main_image_url') ? 'main_image_url' : null);

        // MP discount columns (known from schema)
        $mpDiscActiveCol = Schema::hasColumn('products', 'mp_discount_active') ? 'mp_discount_active' : null;
        $mpDiscPctCol = Schema::hasColumn('products', 'mp_discount_percent') ? 'mp_discount_percent' : null;
        $mpDiscFixedCol = Schema::hasColumn('products', 'mp_discount_fixed_rsd') ? 'mp_discount_fixed_rsd' : null;

        // Old/compare & stock/sale flags
        $compareCol = Schema::hasColumn('products', 'compare_at_rsd') ? 'compare_at_rsd' : null;
        $isSaleCol = Schema::hasColumn('products', 'is_on_sale') ? 'is_on_sale' : null;
        $inStockCol = Schema::hasColumn('products', 'in_stock') ? 'in_stock' : null;

        // ✅ NEW: stock qty (optional, can be null if column doesn't exist)
        $stockQtyCol = Schema::hasColumn('products', 'stock_qty') ? 'stock_qty' : null;

        // --- IMAGES: fetch up to 5 images per product in ONE query ---
        $productIds = $rows->pluck('id')->all();
        $imagesByProduct = $this->fetchImagesForProducts($productIds, 5);

        $products = $rows->map(function ($p) use (
            $nameCol, $slugCol, $priceCol, $imgCol, $imagesByProduct,
            $mpDiscActiveCol, $mpDiscPctCol, $mpDiscFixedCol,
            $compareCol, $isSaleCol, $inStockCol, $stockQtyCol
        ) {
            $pid = (int)$p->id;

            $main = $imgCol ? ($p->{$imgCol} ?? null) : null;
            $imgs = $imagesByProduct[$pid] ?? [];

            if (empty($imgs) && $main) {
                $fallbackUrl = ProductImageProcessor::toPublicUrl((string)$main);
                $imgs = [[
                    'id' => null,
                    'alt' => '',
                    'sort_order' => 0,
                    'original' => $fallbackUrl,
                    'thumb' => $fallbackUrl,
                    'grid' => $fallbackUrl,
                    'pdp' => $fallbackUrl,
                ]];
            }

            $primaryGrid = null;
            if (!empty($imgs)) {
                $primaryGrid = $imgs[0]['grid'] ?? $imgs[0]['thumb'] ?? $imgs[0]['original'] ?? null;
            }
            if (!$primaryGrid && $main) $primaryGrid = ProductImageProcessor::toPublicUrl((string)$main);

            $regular = $priceCol ? (int)($p->{$priceCol} ?? 0) : 0;

            $discActive = $mpDiscActiveCol ? ($p->{$mpDiscActiveCol} ?? null) : null;
            $discPct = $mpDiscPctCol ? ($p->{$mpDiscPctCol} ?? null) : null;
            $discFixed = $mpDiscFixedCol ? ($p->{$mpDiscFixedCol} ?? null) : null;

            $compare = null;
            if ($compareCol) {
                $v = $p->{$compareCol} ?? null;
                if ($v !== null && is_numeric($v)) $compare = (int)$v;
            }

            // current from mp_discount if active
            $currentFromMp = $this->applyMpDiscount($regular, $discActive, $discPct, $discFixed);

            $current = $regular;
            $old = null;

            if ($currentFromMp !== null && $currentFromMp > 0 && $regular > 0 && $currentFromMp < $regular) {
                $current = $currentFromMp;

                // old: prefer compare_at if it exists and is higher than regular (true MSRP), else regular
                if ($compare !== null && $compare > $regular) $old = $compare;
                else $old = $regular;
            } else {
                // no mp discount => compare_at can act as old (if higher than regular)
                $current = $regular;
                if ($compare !== null && $compare > $current) $old = $compare;
            }

            if ($old !== null && $old <= $current) $old = null;

            $percent = $this->calcPercentOff($old, $current);

            $isSale = null;
            if ($isSaleCol) {
                $isSale = (bool)($p->{$isSaleCol} ?? false);
            } else {
                $isSale = $percent !== null;
            }

            $inStock = null;
            if ($inStockCol) {
                $inStock = (bool)($p->{$inStockCol} ?? false);
            }

            // ✅ NEW: stock_qty (nullable)
            $stockQty = null;
            if ($stockQtyCol) {
                $v = $p->{$stockQtyCol} ?? null;
                if ($v !== null && is_numeric($v)) $stockQty = (int)$v;
            }

            return [
                'id' => $p->id,
                'name' => $nameCol ? ($p->{$nameCol} ?? '') : '',
                'slug' => $slugCol ? ($p->{$slugCol} ?? (string)$p->id) : (string)$p->id,

                // ✅ current price that FE shows
                'price_rsd' => $current,

                // ✅ old/percent for crossed-out + pill
                'old_price_rsd' => $old,
                'percent_off' => $percent,

                'is_sale' => $isSale,
                'in_stock' => $inStock,

                // ✅ NEW: used by FE for "Pri kraju" logic
                'stock_qty' => $stockQty,

                'image_grid_url' => $primaryGrid,
                'images' => $imgs,

                // optional debug/telemetry (safe)
                'price_regular_rsd' => $regular,
                'price_mp_discounted_rsd' => $currentFromMp,
                'compare_at_rsd' => $compare,
            ];
        })->values();

        // FACETS
        $facets = [];

        // 1) Brand facet (exclude self)
        if (Schema::hasTable('brands') && Schema::hasColumn('products', 'brand_id')) {
            $bq = clone $base;
            $bq = $applyAllFilters($bq, 'brand');

            $brandNameCol = Schema::hasColumn('brands', 'name') ? 'name' : null;
            $brandSlugCol = Schema::hasColumn('brands', 'slug') ? 'slug' : null;
            $brandSortCol = Schema::hasColumn('brands', 'sort') ? 'sort' : null;

            $selectLabel = $brandNameCol ? "brands.$brandNameCol" : 'brands.id';
            $selectValue = $brandSlugCol ? "brands.$brandSlugCol" : 'brands.id';

            $opts = (clone $bq)
                ->join('brands', 'brands.id', '=', 'products.brand_id')
                ->select(
                    DB::raw("$selectValue as value"),
                    DB::raw("$selectLabel as label"),
                    DB::raw('count(distinct products.id) as count')
                )
                ->groupBy('value', 'label')
                ->when($brandSortCol, fn ($qq) => $qq->orderBy("brands.$brandSortCol"))
                ->orderBy('label')
                ->get();

            $facets[] = [
                'code' => 'brend',
                'label' => 'Brend',
                'type' => 'multi',
                'options' => $opts->map(fn ($x) => [
                    'value' => (string)$x->value,
                    'label' => (string)$x->label,
                    'count' => (int)$x->count,
                ])->values(),
            ];
        }

        // 2) Attribute facets (exclude self)
        if (Schema::hasTable('attributes') && Schema::hasTable('attribute_values') && Schema::hasTable('product_attribute_values')) {
            $attrs = DB::table('attributes')
                ->whereIn('code', $attributeCodes)
                ->where('is_active', 1)
                ->orderBy('sort')
                ->get(['id', 'code', 'name', 'type']);

            foreach ($attrs as $a) {
                $fq = clone $base;
                $fq = $applyAllFilters($fq, $a->code);

                $opts = (clone $fq)
                    ->join('product_attribute_values as pav', 'pav.product_id', '=', 'products.id')
                    ->join('attribute_values as av', 'av.id', '=', 'pav.attribute_value_id')
                    ->where('av.attribute_id', $a->id)
                    ->where('av.is_active', 1)
                    ->select(
                        'av.value as value',
                        'av.label as label',
                        DB::raw('count(distinct products.id) as count'),
                        'av.sort as sort'
                    )
                    ->groupBy('av.value', 'av.label', 'av.sort')
                    ->orderBy('av.sort')
                    ->orderBy('av.label')
                    ->get();

                $facets[] = [
                    'code' => $a->code,
                    'label' => $a->name,
                    'type' => $a->type === 'single' ? 'single' : 'multi',
                    'options' => $opts->map(fn ($x) => [
                        'value' => (string)$x->value,
                        'label' => (string)$x->label,
                        'count' => (int)$x->count,
                    ])->values(),
                ];
            }
        }

        // PRICE META (bez price filtera)
        $priceMeta = null;
        if (Schema::hasColumn('products', 'price_rsd')) {
            $pq = clone $base;
            $pq = $applyAllFilters($pq, 'price');
            $minAvail = (clone $pq)->min('products.price_rsd');
            $maxAvail = (clone $pq)->max('products.price_rsd');

            $priceMeta = [
                'min_available' => $minAvail !== null ? (int)$minAvail : null,
                'max_available' => $maxAvail !== null ? (int)$maxAvail : null,
                'mode' => 'mp_gross_regular',
            ];
        }

        $debug = (string)$request->query('debug', '') === '1';

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug_path' => $category->slug_path,
            ],
            'products' => $products,
            'facets' => $facets,
            'meta' => [
                'price' => $priceMeta,
            ],
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
            ],
            'debug' => $debug ? [
                'slug_path' => (string)$slug_path,
                'category_id' => (int)$category->id,
                'descendant_ids_count' => count($descendantIds),
                'descendant_ids_sample' => array_slice($descendantIds, 0, 20),
                'mp_discount_cols' => [
                    'active' => $mpDiscActiveCol,
                    'percent' => $mpDiscPctCol,
                    'fixed' => $mpDiscFixedCol,
                ],
                'compare_col' => $compareCol,
                'stock_qty_col' => $stockQtyCol,
            ] : null,
        ]);
    }

    // --------------------------
    // PRODUCT (MVP PDP)
    // --------------------------
    public function productBySlug(Request $request, string $slug)
    {
        $slug = trim((string)$slug);
        if ($slug === '') return response()->json(['message' => 'Product not found'], 404);

        $p = DB::table('products')->where('slug', $slug)->first();
        if (!$p) return response()->json(['message' => 'Product not found'], 404);

        $nameCol = Schema::hasColumn('products', 'name') ? 'name' : (Schema::hasColumn('products', 'title') ? 'title' : null);
        $priceCol = Schema::hasColumn('products', 'price_rsd') ? 'price_rsd' : (Schema::hasColumn('products', 'price') ? 'price' : null);

        $regular = $priceCol ? (int)($p->{$priceCol} ?? 0) : 0;

        $compare = Schema::hasColumn('products', 'compare_at_rsd') && isset($p->compare_at_rsd) ? (int)$p->compare_at_rsd : null;

        $currentFromMp = $this->applyMpDiscount(
            $regular,
            Schema::hasColumn('products', 'mp_discount_active') ? ($p->mp_discount_active ?? null) : null,
            Schema::hasColumn('products', 'mp_discount_percent') ? ($p->mp_discount_percent ?? null) : null,
            Schema::hasColumn('products', 'mp_discount_fixed_rsd') ? ($p->mp_discount_fixed_rsd ?? null) : null
        );

        $current = $regular;
        $old = null;

        if ($currentFromMp !== null && $currentFromMp > 0 && $currentFromMp < $regular) {
            $current = $currentFromMp;
            if ($compare !== null && $compare > $regular) $old = $compare;
            else $old = $regular;
        } else {
            $current = $regular;
            if ($compare !== null && $compare > $current) $old = $compare;
        }

        if ($old !== null && $old <= $current) $old = null;

        $percent = $this->calcPercentOff($old, $current);

        $imagesByProduct = $this->fetchImagesForProducts([(int)$p->id], 30);
        $imgs = $imagesByProduct[(int)$p->id] ?? [];

        $categorySlugPath = null;
        if (Schema::hasTable('category_product') && Schema::hasTable('categories')) {
            $categorySlugPath = DB::table('category_product as cp')
                ->join('categories as c', 'c.id', '=', 'cp.category_id')
                ->where('cp.product_id', (int)$p->id)
                ->where('c.is_active', 1)
                ->orderByRaw('LENGTH(c.slug_path) ASC')
                ->value('c.slug_path');
        }

        // ✅ NEW: stock qty on PDP too (nullable)
        $stockQty = null;
        if (Schema::hasColumn('products', 'stock_qty') && isset($p->stock_qty) && is_numeric($p->stock_qty)) {
            $stockQty = (int)$p->stock_qty;
        }

        return response()->json([
            'id' => (int)$p->id,
            'slug' => (string)$p->slug,
            'name' => $nameCol ? (string)($p->{$nameCol} ?? '') : '',

            'price_rsd' => $current,
            'old_price_rsd' => $old,
            'percent_off' => $percent,

            'in_stock' => Schema::hasColumn('products', 'in_stock') ? (bool)($p->in_stock ?? false) : null,
            'stock_qty' => $stockQty,

            'category_slug_path' => $categorySlugPath,
            'images' => $imgs,
            'meta' => [
                'seo_title' => null,
            ],
        ]);
    }

    // --------------------------
    // RESOLVE (category vs product)
    // --------------------------
    public function resolve(Request $request)
    {
        $path = trim((string)$request->query('path', ''), "/");
        if ($path === '') return response()->json(['type' => 'home'], 200);

        $cat = DB::table('categories')->where('slug_path', $path)->where('is_active', 1)->first();
        if ($cat) {
            return response()->json([
                'type' => 'category',
                'category_id' => $cat->id,
                'slug_path' => $cat->slug_path
            ], 200);
        }

        $parts = explode('/', $path);
        $last = trim((string)end($parts));
        if ($last !== '' && Schema::hasColumn('products', 'slug')) {
            $prod = DB::table('products')->where('slug', $last)->first(['id', 'slug']);
            if ($prod) {
                $prefix = implode('/', array_slice($parts, 0, -1));
                $prefixCat = null;
                if ($prefix !== '') {
                    $c2 = DB::table('categories')->where('slug_path', $prefix)->where('is_active', 1)->first(['slug_path']);
                    if ($c2) $prefixCat = (string)$c2->slug_path;
                }

                return response()->json([
                    'type' => 'product',
                    'product_id' => (int)$prod->id,
                    'slug' => (string)$prod->slug,
                    'category_slug_path' => $prefixCat,
                ], 200);
            }
        }

        return response()->json(['type' => 'not_found'], 404);
    }

    // --------------------------
    // CATEGORIES TREE
    // --------------------------
    public function categoriesTree()
    {
        $rows = DB::table('categories')
            ->select('id', 'parent_id', 'name', 'slug', 'slug_path', 'sort', 'is_active')
            ->where('is_active', 1)
            ->orderBy('sort')
            ->orderBy('name')
            ->get();

        $byParent = [];
        foreach ($rows as $r) {
            $pid = $r->parent_id ?? 0;
            if (!isset($byParent[$pid])) $byParent[$pid] = [];
            $byParent[$pid][] = $r;
        }

        $build = function ($parentId, $depth) use (&$build, &$byParent) {
            $children = $byParent[$parentId] ?? [];
            $out = [];
            foreach ($children as $c) {
                $out[] = [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'slug_path' => $c->slug_path,
                    'depth' => $depth,
                    'children' => $build($c->id, $depth + 1),
                ];
            }
            return $out;
        };

        return response()->json(['items' => $build(0, 0)]);
    }

    // --------------------------
    // HELPERS
    // --------------------------
    private function getActiveAttributeCodesForCategory(int $categoryId): array
    {
        if (Schema::hasTable('category_attribute')) {
            $mapped = DB::table('category_attribute as ca')
                ->join('attributes as a', 'a.id', '=', 'ca.attribute_id')
                ->where('ca.category_id', $categoryId)
                ->where('a.is_active', 1)
                ->orderBy('ca.sort')
                ->pluck('a.code')
                ->all();

            if (!empty($mapped)) return $mapped;
        }

        if (Schema::hasTable('attributes')) {
            return DB::table('attributes')
                ->where('is_active', 1)
                ->orderBy('sort')
                ->pluck('code')
                ->all();
        }

        return [];
    }

    private function fetchImagesForProducts(array $productIds, int $limitPerProduct = 5): array
    {
        $imagesByProduct = [];

        if (empty($productIds) || !Schema::hasTable('product_images')) return $imagesByProduct;

        $hasUrl = Schema::hasColumn('product_images', 'url');
        $hasThumb = Schema::hasColumn('product_images', 'thumb_url');
        $hasGrid = Schema::hasColumn('product_images', 'grid_url');
        $hasPdp = Schema::hasColumn('product_images', 'pdp_url');
        $hasAlt = Schema::hasColumn('product_images', 'alt');
        $hasSort = Schema::hasColumn('product_images', 'sort_order');

        $selectCols = ['id', 'product_id'];
        if ($hasUrl) $selectCols[] = 'url';
        if ($hasThumb) $selectCols[] = 'thumb_url';
        if ($hasGrid) $selectCols[] = 'grid_url';
        if ($hasPdp) $selectCols[] = 'pdp_url';
        if ($hasAlt) $selectCols[] = 'alt';
        if ($hasSort) $selectCols[] = 'sort_order';

        $imgRows = DB::table('product_images')
            ->whereIn('product_id', $productIds)
            ->when($hasSort, fn ($qq) => $qq->orderBy('sort_order'))
            ->orderBy('id')
            ->get($selectCols);

        foreach ($imgRows as $r) {
            $pid = (int)$r->product_id;

            if (!isset($imagesByProduct[$pid])) $imagesByProduct[$pid] = [];
            if (count($imagesByProduct[$pid]) >= $limitPerProduct) continue;

            $dto = [
                'id' => (int)$r->id,
                'alt' => $hasAlt ? (string)($r->alt ?? '') : '',
                'sort_order' => $hasSort ? (int)($r->sort_order ?? 0) : 0,
                'original' => $hasUrl ? ProductImageProcessor::toPublicUrl($r->url ?? null) : null,
                'thumb' => $hasThumb ? ProductImageProcessor::toPublicUrl($r->thumb_url ?? null) : null,
                'grid' => $hasGrid ? ProductImageProcessor::toPublicUrl($r->grid_url ?? null) : null,
                'pdp' => $hasPdp ? ProductImageProcessor::toPublicUrl($r->pdp_url ?? null) : null,
            ];

            $usable = $dto['grid'] ?? $dto['thumb'] ?? $dto['original'];
            if (!$usable) continue;

            $uniqKey = (string)($dto['grid'] ?? $usable);
            $already = false;
            foreach ($imagesByProduct[$pid] as $existing) {
                $ek = (string)($existing['grid'] ?? $existing['thumb'] ?? $existing['original'] ?? '');
                if ($ek !== '' && $ek === $uniqKey) { $already = true; break; }
            }
            if ($already) continue;

            $imagesByProduct[$pid][] = $dto;
        }

        return $imagesByProduct;
    }
}
