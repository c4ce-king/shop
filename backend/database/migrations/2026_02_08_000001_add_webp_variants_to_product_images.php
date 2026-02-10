<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('product_images')) return;

        Schema::table('product_images', function (Blueprint $table) {
            // URL-ovi WEBP varijanti (za različite prikaze)
            if (!Schema::hasColumn('product_images', 'url_webp')) $table->string('url_webp')->nullable()->after('id');

            if (!Schema::hasColumn('product_images', 'thumb_url_webp')) $table->string('thumb_url_webp')->nullable();
            if (!Schema::hasColumn('product_images', 'grid_url_webp')) $table->string('grid_url_webp')->nullable();
            if (!Schema::hasColumn('product_images', 'pdp_url_webp')) $table->string('pdp_url_webp')->nullable();
            if (!Schema::hasColumn('product_images', 'zoom_url_webp')) $table->string('zoom_url_webp')->nullable();

            // Meta (opciono, ali korisno)
            if (!Schema::hasColumn('product_images', 'width')) $table->integer('width')->nullable();
            if (!Schema::hasColumn('product_images', 'height')) $table->integer('height')->nullable();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('product_images')) return;

        Schema::table('product_images', function (Blueprint $table) {
            foreach ([
                'url_webp',
                'thumb_url_webp',
                'grid_url_webp',
                'pdp_url_webp',
                'zoom_url_webp',
                'width',
                'height',
            ] as $col) {
                if (Schema::hasColumn('product_images', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
