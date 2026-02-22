<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('stock_alerts')) {
            return;
        }

        Schema::create('stock_alerts', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('product_id');
            $table->string('email', 190);
            $table->string('phone', 50)->nullable();
            $table->string('note', 500)->nullable();

            // metadata (helpful later)
            $table->string('ip', 45)->nullable(); // ipv4/ipv6
            $table->string('user_agent', 255)->nullable();
            $table->string('source', 50)->nullable(); // e.g. "pdp"

            $table->timestamps();

            $table->index('product_id', 'stock_alerts_product_id_idx');
            $table->index('email', 'stock_alerts_email_idx');
            $table->index(['product_id', 'email'], 'stock_alerts_product_email_idx');

            // FK (optional but nice). If you delete product, cascade alerts.
            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('stock_alerts')) {
            return;
        }

        Schema::dropIfExists('stock_alerts');
    }
};
