<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AttributeSeeder extends Seeder
{
    public function run(): void
    {
        $attrs = [
            ['code' => 'brand', 'name' => 'Brend', 'type' => 'multi', 'sort' => 10],
            ['code' => 'size', 'name' => 'Veličina', 'type' => 'multi', 'sort' => 20],
            ['code' => 'color', 'name' => 'Boja', 'type' => 'multi', 'sort' => 30],
        ];

        foreach ($attrs as $a) {
            $id = DB::table('attributes')->where('code', $a['code'])->value('id');
            if ($id) {
                DB::table('attributes')->where('id', $id)->update([
                    'name' => $a['name'],
                    'type' => $a['type'],
                    'sort' => $a['sort'],
                    'is_active' => 1,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('attributes')->insert([
                    'code' => $a['code'],
                    'name' => $a['name'],
                    'type' => $a['type'],
                    'sort' => $a['sort'],
                    'is_active' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $brandId = (int)DB::table('attributes')->where('code', 'brand')->value('id');
        $sizeId  = (int)DB::table('attributes')->where('code', 'size')->value('id');
        $colorId = (int)DB::table('attributes')->where('code', 'color')->value('id');

        // Brand vrednosti iz postojeće brands tabele (ako postoji)
        if (DB::getSchemaBuilder()->hasTable('brands')) {
            $brands = DB::table('brands')->orderBy('sort')->get(['slug', 'name']);
            $i = 10;
            foreach ($brands as $b) {
                DB::table('attribute_values')->updateOrInsert(
                    ['attribute_id' => $brandId, 'value' => $b->slug],
                    ['label' => $b->name, 'sort' => $i, 'is_active' => 1, 'updated_at' => now(), 'created_at' => now()]
                );
                $i += 10;
            }
        }

        // Size: miks garderoba + obuća (možemo kasnije razdvojiti na size_apparel i size_shoes)
        $sizes = [
            ['value' => 'xs', 'label' => 'XS', 'sort' => 10],
            ['value' => 's', 'label' => 'S', 'sort' => 20],
            ['value' => 'm', 'label' => 'M', 'sort' => 30],
            ['value' => 'l', 'label' => 'L', 'sort' => 40],
            ['value' => 'xl', 'label' => 'XL', 'sort' => 50],
            ['value' => '42', 'label' => '42', 'sort' => 110],
            ['value' => '43', 'label' => '43', 'sort' => 120],
            ['value' => '44', 'label' => '44', 'sort' => 130],
        ];
        foreach ($sizes as $s) {
            DB::table('attribute_values')->updateOrInsert(
                ['attribute_id' => $sizeId, 'value' => $s['value']],
                ['label' => $s['label'], 'sort' => $s['sort'], 'is_active' => 1, 'updated_at' => now(), 'created_at' => now()]
            );
        }

        $colors = [
            ['value' => 'black', 'label' => 'Crna', 'sort' => 10],
            ['value' => 'white', 'label' => 'Bela', 'sort' => 20],
            ['value' => 'red', 'label' => 'Crvena', 'sort' => 30],
        ];
        foreach ($colors as $c) {
            DB::table('attribute_values')->updateOrInsert(
                ['attribute_id' => $colorId, 'value' => $c['value']],
                ['label' => $c['label'], 'sort' => $c['sort'], 'is_active' => 1, 'updated_at' => now(), 'created_at' => now()]
            );
        }

        dump(['seeded_attributes' => true]);
    }
}
