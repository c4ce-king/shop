<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('category_attribute')) {
            return;
        }

        Schema::create('category_attribute', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('attribute_id')->constrained('attributes')->cascadeOnDelete();
            $table->unsignedInteger('sort')->default(100);
            $table->timestamps();

            $table->unique(['category_id', 'attribute_id']);
            $table->index(['category_id', 'sort']);
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('category_attribute')) {
            return;
        }

        Schema::dropIfExists('category_attribute');
    }
};
