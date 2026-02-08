<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoCatalogSeeder extends Seeder
{
    public function run(): void
    {
        // napravi demo kategoriju
        $catId = DB::table('categories')->insertGetId([
            'parent_id' => null,
            'name' => 'Demo',
            'slug' => 'demo',
            'slug_path' => 'demo',
            'sort' => 0,
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // closure self
        DB::table('category_closure')->insert([
            'ancestor_id' => $catId,
            'descendant_id' => $catId,
            'depth' => 0,
        ]);

        // poveži prva 3 proizvoda (ako postoje)
        $productIds = DB::table('products')->orderBy('id')->limit(3)->pluck('id')->all();

        foreach ($productIds as $pid) {
            DB::table('category_product')->insert([
                'category_id' => $catId,
                'product_id' => $pid,
            ]);
        }
    }
}
