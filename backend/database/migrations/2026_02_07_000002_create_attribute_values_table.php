<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('attribute_values')) {
            return;
        }

        Schema::create('attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained('attributes')->cascadeOnDelete();
            $table->string('value', 64);   // npr xl, black
            $table->string('label', 128);  // npr XL, Crna
            $table->unsignedInteger('sort')->default(100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['attribute_id', 'value']);
            $table->index(['attribute_id', 'sort']);
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('attribute_values')) {
            return;
        }

        Schema::dropIfExists('attribute_values');
    }
};
