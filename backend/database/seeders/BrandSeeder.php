<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['name' => 'Lelo',   'slug' => 'lelo',   'sort' => 10, 'is_active' => 1],
            ['name' => 'Svakom', 'slug' => 'svakom', 'sort' => 20, 'is_active' => 1],
            ['name' => 'Durex',  'slug' => 'durex',  'sort' => 30, 'is_active' => 1],
        ];

        foreach ($brands as $b) {
            $exists = DB::table('brands')->where('slug', $b['slug'])->first();
            if (!$exists) {
                DB::table('brands')->insert([
                    'name' => $b['name'],
                    'slug' => $b['slug'],
                    'sort' => $b['sort'],
                    'is_active' => $b['is_active'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // dodeli brendove prvih nekoliko proizvoda (demo)
        $brandIds = DB::table('brands')->orderBy('sort')->pluck('id')->all();
        if (count($brandIds) === 0) return;

        $products = DB::table('products')->orderBy('id')->limit(12)->get(['id']);
        $i = 0;
        foreach ($products as $p) {
            $bid = $brandIds[$i % count($brandIds)];
            DB::table('products')->where('id', $p->id)->update(['brand_id' => $bid]);
            $i++;
        }
    }
}
