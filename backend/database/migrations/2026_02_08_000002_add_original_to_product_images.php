<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('product_images')) return;

        Schema::table('product_images', function (Blueprint $table) {
            // Original (izvorni fajl)
            if (!Schema::hasColumn('product_images', 'original_path')) {
                $table->string('original_path')->nullable()->after('url_webp');
            }

            if (!Schema::hasColumn('product_images', 'original_url')) {
                $table->string('original_url')->nullable()->after('original_path');
            }

            // Meta o originalu (korisno)
            if (!Schema::hasColumn('product_images', 'original_ext')) {
                $table->string('original_ext', 12)->nullable()->after('original_url');
            }

            if (!Schema::hasColumn('product_images', 'original_mime')) {
                $table->string('original_mime', 80)->nullable()->after('original_ext');
            }

            if (!Schema::hasColumn('product_images', 'original_size_bytes')) {
                $table->bigInteger('original_size_bytes')->nullable()->after('original_mime');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('product_images')) return;

        Schema::table('product_images', function (Blueprint $table) {
            foreach ([
                'original_path',
                'original_url',
                'original_ext',
                'original_mime',
                'original_size_bytes',
            ] as $col) {
                if (Schema::hasColumn('product_images', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
