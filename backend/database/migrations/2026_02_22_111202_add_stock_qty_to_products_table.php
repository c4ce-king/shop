<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'stock_qty')) {
                return;
            }

            if (Schema::hasColumn('products', 'in_stock')) {
                $table->unsignedSmallInteger('stock_qty')->default(0)->after('in_stock');
            } else {
                $table->unsignedSmallInteger('stock_qty')->default(0);
            }

            $table->index('stock_qty', 'products_stock_qty_index');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'stock_qty')) {
                return;
            }

            $table->dropIndex('products_stock_qty_index');
            $table->dropColumn('stock_qty');
        });
    }
};
