<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttributeAssignSeeder extends Seeder
{
    public function run(): void
    {
        // sanity: tabele koje moraju postojati
        $required = [
            'attributes',
            'attribute_values',
            'product_attribute_values',
            'products',
            'category_product',
            'category_attribute',
        ];

        foreach ($required as $t) {
            if (!DB::getSchemaBuilder()->hasTable($t)) {
                dump(['error' => "missing table: {$t}"]);
                return;
            }
        }

        // Proizvodi
        $productIds = DB::table('products')->orderBy('id')->pluck('id')->all();
        if (count($productIds) === 0) {
            dump(['error' => 'no products']);
            return;
        }

        // product_id -> [category_id,...]
        $prodCats = [];
        $cpRows = DB::table('category_product')->select('product_id', 'category_id')->get();
        foreach ($cpRows as $r) {
            $pid = (int)$r->product_id;
            $cid = (int)$r->category_id;
            $prodCats[$pid] ??= [];
            $prodCats[$pid][] = $cid;
        }

        // category_id -> [attribute_id,...] (iz mapiranja)
        $catAttrs = [];
        $caRows = DB::table('category_attribute')->select('category_id', 'attribute_id')->get();
        foreach ($caRows as $r) {
            $cid = (int)$r->category_id;
            $aid = (int)$r->attribute_id;
            $catAttrs[$cid] ??= [];
            $catAttrs[$cid][] = $aid;
        }

        // Svi atributi koje ćemo realno dodeljivati = svi iz category_attribute
        $allAttrIds = DB::table('category_attribute')->distinct()->pluck('attribute_id')->map(fn ($x) => (int)$x)->all();
        if (count($allAttrIds) === 0) {
            dump(['error' => 'no category_attribute mappings (run CatalogAttributeSeeder first)']);
            return;
        }

        // Atribut meta: id -> ['code'=>..., 'type'=>...]
        $attrMeta = [];
        $attrRows = DB::table('attributes')
            ->whereIn('id', $allAttrIds)
            ->select('id', 'code', 'type', 'is_active')
            ->get();

        foreach ($attrRows as $a) {
            if ((int)$a->is_active !== 1) continue;
            $attrMeta[(int)$a->id] = [
                'code' => (string)$a->code,
                'type' => (string)$a->type, // 'multi' | 'single'
            ];
        }

        if (count($attrMeta) === 0) {
            dump(['error' => 'no active attributes found for category_attribute']);
            return;
        }

        // attribute_id -> [attribute_value_id,...] (samo aktivne vrednosti)
        $attrVals = [];
        $valRows = DB::table('attribute_values')
            ->whereIn('attribute_id', array_keys($attrMeta))
            ->where('is_active', 1)
            ->select('id', 'attribute_id')
            ->get();

        foreach ($valRows as $v) {
            $aid = (int)$v->attribute_id;
            $attrVals[$aid] ??= [];
            $attrVals[$aid][] = (int)$v->id;
        }

        // Odbaci atribute bez vrednosti
        foreach (array_keys($attrMeta) as $aid) {
            if (empty($attrVals[$aid])) {
                unset($attrMeta[$aid]);
            }
        }

        if (count($attrMeta) === 0) {
            dump(['error' => 'no attributes with active values']);
            return;
        }

        $rows = [];
        $productsProcessed = 0;
        $now = now();

        foreach ($productIds as $pidRaw) {
            $pid = (int)$pidRaw;
            $cats = $prodCats[$pid] ?? [];

            // Union atributa kroz sve kategorije u kojima je proizvod
            $wantedAttrIds = [];
            foreach ($cats as $cid) {
                foreach (($catAttrs[$cid] ?? []) as $aid) {
                    // samo aktivni i koji imaju vrednosti
                    if (isset($attrMeta[$aid])) {
                        $wantedAttrIds[$aid] = true;
                    }
                }
            }

            // Ako proizvod nema kategorije ili mapping, fallback:
            // dodeli bar osnovne atribute ako postoje (brand/size/color/material)
            if (count($wantedAttrIds) === 0) {
                foreach (['brand', 'size', 'color', 'material'] as $code) {
                    $aid = DB::table('attributes')->where('code', $code)->value('id');
                    if ($aid && isset($attrMeta[(int)$aid])) {
                        $wantedAttrIds[(int)$aid] = true;
                    }
                }
            }

            foreach (array_keys($wantedAttrIds) as $aid) {
                $values = $attrVals[$aid] ?? [];
                if (count($values) === 0) continue;

                $type = $attrMeta[$aid]['type'] ?? 'multi';

                // 1 obavezna vrednost
                $v1 = (int)$values[array_rand($values)];
                $rows[] = [
                    'product_id' => $pid,
                    'attribute_value_id' => $v1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                // Ako je multi, ponekad dodeli još jednu različitu vrednost (npr. veličine)
                if ($type === 'multi' && count($values) > 1) {
                    // malo konzervativnije da ne pretrpamo: 25%
                    if (random_int(0, 100) < 25) {
                        $v2 = $v1;
                        $guard = 0;
                        while ($v2 === $v1 && $guard < 10) {
                            $v2 = (int)$values[array_rand($values)];
                            $guard++;
                        }
                        if ($v2 !== $v1) {
                            $rows[] = [
                                'product_id' => $pid,
                                'attribute_value_id' => $v2,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }
                    }
                }

                // bulk flush
                if (count($rows) >= 2000) {
                    DB::table('product_attribute_values')->insertOrIgnore($rows);
                    $rows = [];
                }
            }

            $productsProcessed++;
        }

        if (!empty($rows)) {
            DB::table('product_attribute_values')->insertOrIgnore($rows);
        }

        $pavCount = (int) DB::table('product_attribute_values')->count();

        dump([
            'products_processed' => $productsProcessed,
            'pav_total_rows' => $pavCount,
            'assigned_attributes' => count($attrMeta),
            'note' => 'uses category_attribute mapping; does not overwrite mapping',
        ]);
    }
}
