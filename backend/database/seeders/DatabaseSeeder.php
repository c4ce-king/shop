<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            BrandSeeder::class,

            // 1) osnovni atributi + vrednosti
            AttributeSeeder::class,

            // 2) cleanup (SR name/label/sort/is_active) za size/color/material
            AttributeCleanupSeeder::class,

            // 3) mapiranje atributa na katalog/kategorije
            CatalogAttributeSeeder::class,

            // 4) proizvodi
            ProductSeeder::class,

            // 5) dodela attribute values proizvodima (mora posle ProductSeeder)
            AttributeAssignSeeder::class,
        ]);
    }
}
