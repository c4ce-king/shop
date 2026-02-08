<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'brand_id')) {
                $table->unsignedBigInteger('brand_id')->nullable()->index()->after('id');
                $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'brand_id')) {
                // drop FK first (Laravel naming convention)
                try { $table->dropForeign(['brand_id']); } catch (\Throwable $e) {}
                $table->dropColumn('brand_id');
            }
        });
    }
};
