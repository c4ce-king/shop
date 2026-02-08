<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ako tabela ne postoji (za svaki slučaj), napravi je
        if (!Schema::hasTable('product_images')) {
            Schema::create('product_images', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_id');
                $table->string('url', 600);
                $table->string('alt', 255)->nullable();
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->index('product_id');
            });

            return;
        }

        // Ako postoji, dodaj kolone koje fale
        Schema::table('product_images', function (Blueprint $table) {
            if (!Schema::hasColumn('product_images', 'product_id')) {
                $table->unsignedBigInteger('product_id')->nullable();
                $table->index('product_id');
            }
            if (!Schema::hasColumn('product_images', 'url')) {
                $table->string('url', 600)->nullable();
            }
            if (!Schema::hasColumn('product_images', 'alt')) {
                $table->string('alt', 255)->nullable();
            }
            if (!Schema::hasColumn('product_images', 'sort_order')) {
                $table->integer('sort_order')->default(0);
            }
            if (!Schema::hasColumn('product_images', 'created_at') && !Schema::hasColumn('product_images', 'updated_at')) {
                $table->timestamps();
            }
        });

        // Foreign key je opciono (na localu može bez njega), ali ako želiš kasnije:
        // - prvo moraš da osiguraš da product_id nije null i da postoje proizvodi
    }

    public function down(): void
    {
        // Namerno prazno
    }
};
