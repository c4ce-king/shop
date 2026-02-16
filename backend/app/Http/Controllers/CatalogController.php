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
        if (Schema::hasTable('category_closure')) {
            $descendantIds = DB::table('category_closure')
                ->where('ancestor_id', $category->id)
                ->pluck('descendant_id')
                ->all();
        }
        if (empty($descendantIds)) $descendantIds = [$category->id];

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
            // Price
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

        // SORT
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

        // --- IMAGES: fetch up to 5 images per product in ONE query (original + webp variants) ---
        $productIds = $rows->pluck('id')->all();
        $imagesByProduct = $this->fetchImagesForProducts($productIds, 5);

        $products = $rows->map(function ($p) use ($nameCol, $slugCol, $priceCol, $imgCol, $imagesByProduct) {
            $pid = (int)$p->id;

            // Legacy/main fallback column on products table
            $main = $imgCol ? ($p->{$imgCol} ?? null) : null;

            $imgs = $imagesByProduct[$pid] ?? [];

            // If no product_images exist, fallback to main_image_url as a single image (best-effort)
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

            // Primary image for listing: prefer first image grid, else main
            $primaryGrid = null;
            if (!empty($imgs)) {
                $primaryGrid = $imgs[0]['grid'] ?? $imgs[0]['thumb'] ?? $imgs[0]['original'] ?? null;
            }
            if (!$primaryGrid && $main) $primaryGrid = ProductImageProcessor::toPublicUrl((string)$main);

            return [
                'id' => $p->id,
                'name' => $nameCol ? ($p->{$nameCol} ?? '') : '',
                'slug' => $slugCol ? ($p->{$slugCol} ?? (string)$p->id) : (string)$p->id,
                'price_rsd' => $priceCol ? (int)($p->{$priceCol} ?? 0) : 0,

                // For old code paths (cards that expect a single image)
                'image_grid_url' => $primaryGrid,

                // NEW: full mini gallery objects for list view
                'images' => $imgs,
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

        $imagesByProduct = $this->fetchImagesForProducts([(int)$p->id], 30);
        $imgs = $imagesByProduct[(int)$p->id] ?? [];

        // (MVP) category slug_path za breadcrumbs: uzmi jednu kategoriju (najplića ili prva)
        $categorySlugPath = null;
        if (Schema::hasTable('category_product') && Schema::hasTable('categories')) {
            $categorySlugPath = DB::table('category_product as cp')
                ->join('categories as c', 'c.id', '=', 'cp.category_id')
                ->where('cp.product_id', (int)$p->id)
                ->where('c.is_active', 1)
                ->orderByRaw('LENGTH(c.slug_path) ASC')
                ->value('c.slug_path');
        }

        return response()->json([
            'id' => (int)$p->id,
            'slug' => (string)$p->slug,
            'name' => $nameCol ? (string)($p->{$nameCol} ?? '') : '',
            'price_rsd' => $priceCol ? (int)($p->{$priceCol} ?? 0) : 0,
            'category_slug_path' => $categorySlugPath,
            'images' => $imgs,
            'meta' => [
                'seo_title' => null, // FE može da setuje: "{name} – {price} | Shop"
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

        // 1) Ako je exact category slug_path
        $cat = DB::table('categories')->where('slug_path', $path)->where('is_active', 1)->first();
        if ($cat) {
            return response()->json([
                'type' => 'category',
                'category_id' => $cat->id,
                'slug_path' => $cat->slug_path
            ], 200);
        }

        // 2) Inače tretiraj poslednji segment kao product slug (MVP)
        $parts = explode('/', $path);
        $last = trim((string)end($parts));
        if ($last !== '' && Schema::hasColumn('products', 'slug')) {
            $prod = DB::table('products')->where('slug', $last)->first(['id', 'slug']);
            if ($prod) {
                // pokuša da nađe category slug_path kao prefix (ako postoji)
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
        $imagesByProduct = []; // pid => [dto...]

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
