<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Ne dupliraj ako već ima "dosta" proizvoda
        $existing = (int)DB::table('products')->count();
        if ($existing >= 50) {
            dump(['skipped' => true, 'products_total' => $existing]);
            return;
        }

        $count = 120;

        // leaf kategorije
        $cats = DB::table('categories')->get(['id', 'parent_id']);
        $hasChildren = [];
        foreach ($cats as $c) {
            if ($c->parent_id) $hasChildren[(int)$c->parent_id] = true;
        }
        $leafIds = [];
        foreach ($cats as $c) {
            $id = (int)$c->id;
            if (!isset($hasChildren[$id])) $leafIds[] = $id;
        }

        if (count($leafIds) === 0) {
            dump(['error' => 'no leaf categories']);
            return;
        }

        // brendovi (ako postoje)
        $brandIds = [];
        try {
            if (DB::getSchemaBuilder()->hasTable('brands')) {
                $brandIds = DB::table('brands')->orderBy('sort')->pluck('id')->all();
            }
        } catch (\Throwable $e) {
            $brandIds = [];
        }

        // kolone koje očekujemo (minimalni set)
        $hasName = DB::getSchemaBuilder()->hasColumn('products', 'name');
        $hasTitle = DB::getSchemaBuilder()->hasColumn('products', 'title');
        $nameCol = $hasName ? 'name' : ($hasTitle ? 'title' : null);

        $hasSlug = DB::getSchemaBuilder()->hasColumn('products', 'slug');
        $hasPriceRsd = DB::getSchemaBuilder()->hasColumn('products', 'price_rsd');

        if (!$nameCol || !$hasSlug || !$hasPriceRsd) {
            dump([
                'error' => 'products table missing required columns',
                'needs' => ['name or title', 'slug', 'price_rsd'],
            ]);
            return;
        }

        $names = [
            'Test vibrator', 'Mini wand', 'Rabbit deluxe', 'Anal plug', 'Prostata massager',
            'Lubrikant water', 'Lubrikant silicone', 'BDSM lisice', 'Bič mini', 'Kondomi ultra tanki',
            'Prsten vibracioni', 'Remote egg', 'Set starter', 'Premium toy', 'Diskretan model',
        ];

        $insert = [];
        for ($i = 1; $i <= $count; $i++) {
            $base = $names[array_rand($names)] . " " . $i;
            $slug = Str::slug($base);

            // izbegni duplikat slug
            $slug = $slug . '-' . substr(md5($slug . '|' . $i), 0, 6);

            $row = [
                $nameCol => $base,
                'slug' => $slug,
                'price_rsd' => random_int(1190, 15990),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // opcionalno: brand_id
            if (DB::getSchemaBuilder()->hasColumn('products', 'brand_id') && count($brandIds) > 0) {
                $row['brand_id'] = $brandIds[($i - 1) % count($brandIds)];
            }

            $insert[] = $row;
        }

        // ubaci proizvode
        foreach (array_chunk($insert, 300) as $chunk) {
            DB::table('products')->insert($chunk);
        }

        // pids novih proizvoda (uzmi poslednjih $count po id)
        $pids = DB::table('products')->orderByDesc('id')->limit($count)->pluck('id')->all();
        $pids = array_reverse($pids);

        // attach na leaf kategorije
        $pivot = [];
        $j = 0;
        foreach ($pids as $pid) {
            $catId = $leafIds[$j % count($leafIds)];
            $pivot[] = ['category_id' => $catId, 'product_id' => (int)$pid];
            $j++;
        }

        foreach (array_chunk($pivot, 1000) as $chunk) {
            DB::table('category_product')->insertOrIgnore($chunk);
        }

        dump([
            'inserted_products' => $count,
            'products_total' => (int)DB::table('products')->count(),
            'attached_pivots' => count($pivot),
            'leaf_categories' => count($leafIds),
        ]);
    }
}
