<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AttributeCleanupSeeder extends Seeder
{
    public function run(): void
    {
        if (!Schema::hasTable('attributes')) {
            $this->command?->warn('Table attributes not found, skipping AttributeCleanupSeeder.');
            return;
        }

        // 1) Upsert atributa (name/type/sort/is_active)
        $this->upsertAttribute('size', 'Veličina', 'multi', 20, 1);
        $this->upsertAttribute('color', 'Boja', 'multi', 30, 1);
        $this->upsertAttribute('material', 'Materijal', 'multi', 40, 1);

        // 2) Upsert vrednosti za boje i materijale (label na SR, value ostaje backend code)
        if (Schema::hasTable('attribute_values')) {
            $colorId = DB::table('attributes')->where('code', 'color')->value('id');
            if ($colorId) {
                $this->upsertAttributeValues($colorId, [
                    'black'  => ['Crna', 10],
                    'white'  => ['Bela', 20],
                    'red'    => ['Crvena', 30],
                    'pink'   => ['Roze', 40],
                    'blue'   => ['Plava', 50],
                    'green'  => ['Zelena', 60],
                    'purple' => ['Ljubičasta', 70],
                    'yellow' => ['Žuta', 80],
                    'gray'   => ['Siva', 90],
                    'orange' => ['Narandžasta', 100],
                    'brown'  => ['Braon', 110],
                ]);
            }

            $materialId = DB::table('attributes')->where('code', 'material')->value('id');
            if ($materialId) {
                $this->upsertAttributeValues($materialId, [
                    'latex'    => ['Lateks', 10],
                    'silicone' => ['Silikon', 20],
                    'metal'    => ['Metal', 30],
                    'glass'    => ['Staklo', 40],
                    'leather'  => ['Koža', 50],
                    'pvc'      => ['PVC', 60],
                ]);
            }
        }

        $this->command?->info('AttributeCleanupSeeder: size/color/material names + values labels synced (SR).');
    }

    private function upsertAttribute(string $code, string $name, string $type, int $sort, int $isActive): void
    {
        $data = [];

        // name
        if (Schema::hasColumn('attributes', 'name')) $data['name'] = $name;

        // type (ako postoji)
        if (Schema::hasColumn('attributes', 'type')) $data['type'] = $type;

        // sort (ako postoji)
        if (Schema::hasColumn('attributes', 'sort')) $data['sort'] = $sort;

        // is_active (ako postoji)
        if (Schema::hasColumn('attributes', 'is_active')) $data['is_active'] = $isActive;

        // updated_at (ako postoji)
        if (Schema::hasColumn('attributes', 'updated_at')) $data['updated_at'] = now();

        DB::table('attributes')->updateOrInsert(
            ['code' => $code],
            $data
        );
    }

    /**
     * @param int $attributeId
     * @param array<string, array{0:string,1:int}> $map value => [label, sort]
     */
    private function upsertAttributeValues(int $attributeId, array $map): void
    {
        foreach ($map as $value => [$label, $sort]) {
            $data = [];

            if (Schema::hasColumn('attribute_values', 'label')) $data['label'] = $label;
            if (Schema::hasColumn('attribute_values', 'sort')) $data['sort'] = $sort;
            if (Schema::hasColumn('attribute_values', 'is_active')) $data['is_active'] = 1;
            if (Schema::hasColumn('attribute_values', 'updated_at')) $data['updated_at'] = now();

            DB::table('attribute_values')->updateOrInsert(
                ['attribute_id' => $attributeId, 'value' => $value],
                $data
            );
        }
    }
}
