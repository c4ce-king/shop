<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('stock_alerts')) return;

        Schema::table('stock_alerts', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_alerts', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
                $table->index('user_id', 'stock_alerts_user_id_idx');
            }
        });

        // Unique for logged-in users (user_id + product_id)
        Schema::table('stock_alerts', function (Blueprint $table) {
            // avoid duplicate constraint names
            $table->unique(['user_id', 'product_id'], 'stock_alerts_user_product_unique');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('stock_alerts')) return;

        Schema::table('stock_alerts', function (Blueprint $table) {
            try { $table->dropUnique('stock_alerts_user_product_unique'); } catch (\Throwable $e) {}
            try { $table->dropIndex('stock_alerts_user_id_idx'); } catch (\Throwable $e) {}

            if (Schema::hasColumn('stock_alerts', 'user_id')) {
                $table->dropColumn('user_id');
            }
        });
    }
};
