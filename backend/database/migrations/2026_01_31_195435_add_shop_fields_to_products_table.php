<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {

            // ✅ OSNOVNO (da API radi)
            if (!Schema::hasColumn('products', 'title')) {
                $table->string('title', 255)->nullable();
            }

            if (!Schema::hasColumn('products', 'price_rsd')) {
                $table->integer('price_rsd')->default(0);
            }

            if (!Schema::hasColumn('products', 'slug')) {
                $table->string('slug', 255)->nullable();
            }

            // Opis / sadržaj
            if (!Schema::hasColumn('products', 'rezime')) {
                $table->string('rezime', 500)->nullable();
            }
            if (!Schema::hasColumn('products', 'opis_html')) {
                $table->longText('opis_html')->nullable();
            }

            // Cene / akcije
            if (!Schema::hasColumn('products', 'compare_at_rsd')) {
                $table->integer('compare_at_rsd')->nullable();
            }
            if (!Schema::hasColumn('products', 'is_on_sale')) {
                $table->boolean('is_on_sale')->default(false);
            }

            // Status
            if (!Schema::hasColumn('products', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
            if (!Schema::hasColumn('products', 'in_stock')) {
                $table->boolean('in_stock')->default(true);
            }

            // Slike
            if (!Schema::hasColumn('products', 'main_image_url')) {
                $table->string('main_image_url', 600)->nullable();
            }

            // SEO
            if (!Schema::hasColumn('products', 'seo_title')) {
                $table->string('seo_title', 255)->nullable();
            }
            if (!Schema::hasColumn('products', 'seo_description')) {
                $table->string('seo_description', 320)->nullable();
            }
            if (!Schema::hasColumn('products', 'canonical_url')) {
                $table->string('canonical_url', 600)->nullable();
            }
            if (!Schema::hasColumn('products', 'og_title')) {
                $table->string('og_title', 255)->nullable();
            }
            if (!Schema::hasColumn('products', 'og_description')) {
                $table->string('og_description', 320)->nullable();
            }
            if (!Schema::hasColumn('products', 'og_image_url')) {
                $table->string('og_image_url', 600)->nullable();
            }
            if (!Schema::hasColumn('products', 'twitter_card')) {
                $table->string('twitter_card', 32)->nullable();
            }
            if (!Schema::hasColumn('products', 'noindex')) {
                $table->boolean('noindex')->default(false);
            }

            // timestamps (ako fale)
            if (!Schema::hasColumn('products', 'created_at') && !Schema::hasColumn('products', 'updated_at')) {
                $table->timestamps();
            }
        });

        // unique index za slug (pokušaj “tiho”)
        try {
            Schema::table('products', function (Blueprint $table) {
                $table->unique('slug');
            });
        } catch (\Throwable $e) {
            // verovatno već postoji ili slug nije pogodna za unique trenutno
        }
    }

    public function down(): void
    {
        // Namerno prazno
    }
};
