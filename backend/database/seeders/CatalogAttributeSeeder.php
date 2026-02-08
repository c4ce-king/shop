<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CatalogAttributeSeeder extends Seeder
{
    private function hasCols(string $table, array $cols): bool
    {
        if (!Schema::hasTable($table)) return false;
        foreach ($cols as $c) {
            if (!Schema::hasColumn($table, $c)) return false;
        }
        return true;
    }

    private function addTimestampsIfExist(string $table, array $row): array
    {
        if (Schema::hasColumn($table, 'created_at') && !isset($row['created_at'])) {
            $row['created_at'] = now();
        }
        if (Schema::hasColumn($table, 'updated_at') && !isset($row['updated_at'])) {
            $row['updated_at'] = now();
        }
        return $row;
    }

    public function run(): void
    {
        if (!Schema::hasTable('attributes') || !Schema::hasTable('attribute_values') || !Schema::hasTable('product_attribute_values')) {
            dump(['skipped' => true, 'reason' => 'attribute tables missing']);
            return;
        }

        // 1) attributes
        $attrs = [
            ['code' => 'size', 'name' => 'Veličina', 'type' => 'multi', 'sort' => 10],
            ['code' => 'color', 'name' => 'Boja', 'type' => 'multi', 'sort' => 20],
            ['code' => 'material', 'name' => 'Materijal', 'type' => 'multi', 'sort' => 30],
        ];

        foreach ($attrs as $a) {
            // updateOrInsert – ali samo kolone koje postoje
            $payload = [
                'name' => $a['name'],
                'type' => $a['type'],
                'sort' => $a['sort'],
            ];

            if (Schema::hasColumn('attributes', 'is_active')) $payload['is_active'] = 1;

            $payload = $this->addTimestampsIfExist('attributes', $payload);

            DB::table('attributes')->updateOrInsert(['code' => $a['code']], $payload);
        }

        $attrIds = DB::table('attributes')->pluck('id', 'code')->all();

        // 2) values
        $values = [
            'size' => [
                ['value' => 'xs', 'label' => 'XS', 'sort' => 10],
                ['value' => 's', 'label' => 'S', 'sort' => 20],
                ['value' => 'm', 'label' => 'M', 'sort' => 30],
                ['value' => 'l', 'label' => 'L', 'sort' => 40],
                ['value' => 'xl', 'label' => 'XL', 'sort' => 50],
            ],
            'color' => [
                ['value' => 'black', 'label' => 'Crna', 'sort' => 10],
                ['value' => 'white', 'label' => 'Bela', 'sort' => 20],
                ['value' => 'red', 'label' => 'Crvena', 'sort' => 30],
                ['value' => 'pink', 'label' => 'Roze', 'sort' => 40],
            ],
            'material' => [
                ['value' => 'silicone', 'label' => 'Silikon', 'sort' => 10],
                ['value' => 'latex', 'label' => 'Lateks', 'sort' => 20],
                ['value' => 'glass', 'label' => 'Staklo', 'sort' => 30],
                ['value' => 'metal', 'label' => 'Metal', 'sort' => 40],
            ],
        ];

        foreach ($values as $code => $rows) {
            $aid = $attrIds[$code] ?? null;
            if (!$aid) continue;

            foreach ($rows as $v) {
                $payload = [
                    'label' => $v['label'],
                ];

                if (Schema::hasColumn('attribute_values', 'sort')) $payload['sort'] = $v['sort'];
                if (Schema::hasColumn('attribute_values', 'is_active')) $payload['is_active'] = 1;

                $payload = $this->addTimestampsIfExist('attribute_values', $payload);

                DB::table('attribute_values')->updateOrInsert(
                    ['attribute_id' => $aid, 'value' => $v['value']],
                    $payload
                );
            }
        }

        // 3) map attributes to leaf categories (ako postoji category_attribute)
        if (Schema::hasTable('category_attribute')) {
            $leafIds = DB::table('categories')
                ->where('is_active', 1)
                ->whereNotIn('id', function ($q) {
                    $q->select('parent_id')->from('categories')->whereNotNull('parent_id');
                })
                ->pluck('id')
                ->all();

            $mapRows = [];
            foreach ($leafIds as $cid) {
                foreach (['size', 'color', 'material'] as $code) {
                    $aid = $attrIds[$code] ?? null;
                    if (!$aid) continue;

                    $row = [
                        'category_id' => $cid,
                        'attribute_id' => $aid,
                    ];

                    if (Schema::hasColumn('category_attribute', 'sort')) {
                        $row['sort'] = $code === 'size' ? 10 : ($code === 'color' ? 20 : 30);
                    }

                    $row = $this->addTimestampsIfExist('category_attribute', $row);

                    $mapRows[] = $row;
                }
            }

            if (!empty($mapRows)) {
                DB::table('category_attribute')->insertOrIgnore($mapRows);
            }
        }

        // 4) attach random attribute values to products
        $productIds = DB::table('products')->pluck('id')->all();

        $avByCode = [];
        foreach (array_keys($values) as $code) {
            $aid = $attrIds[$code] ?? null;
            if (!$aid) continue;

            $q = DB::table('attribute_values')->where('attribute_id', $aid);
            if (Schema::hasColumn('attribute_values', 'is_active')) $q->where('is_active', 1);

            $avByCode[$code] = $q->pluck('id')->all();
        }

        $pivotRows = [];
        foreach ($productIds as $pid) {
            foreach ($avByCode as $code => $avIds) {
                if (empty($avIds)) continue;

                $pickCount = ($code === 'size') ? 1 : random_int(1, 2);
                shuffle($avIds);
                $picked = array_slice($avIds, 0, $pickCount);

                foreach ($picked as $avid) {
                    $row = [
                        'product_id' => $pid,
                        'attribute_value_id' => $avid,
                    ];
                    $row = $this->addTimestampsIfExist('product_attribute_values', $row);
                    $pivotRows[] = $row;
                }
            }
        }

        if (!empty($pivotRows)) {
            DB::table('product_attribute_values')->insertOrIgnore($pivotRows);
        }

        dump([
            'ok' => true,
            'attributes' => DB::table('attributes')->count(),
            'attribute_values' => DB::table('attribute_values')->count(),
            'product_attribute_values' => DB::table('product_attribute_values')->count(),
            'category_attribute' => Schema::hasTable('category_attribute') ? DB::table('category_attribute')->count() : null,
        ]);
    }
}
