<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // 1) osnovne strukture
            CategorySeeder::class,
            BrandSeeder::class,

            // 2) atributi + vrednosti + mapiranje kategorija -> atributi
            AttributeSeeder::class,
            CatalogAttributeSeeder::class,

            // 3) proizvodi (120+)
            ProductSeeder::class,

            // 4) dodela atributa proizvodima (puni product_attribute_values)
            AttributeAssignSeeder::class,
        ]);
    }
}
