<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('attributes')) {
            return;
        }

        Schema::create('attributes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique(); // npr size, color
            $table->string('name', 128);          // npr Veličina, Boja
            $table->string('type', 16)->default('multi'); // multi|single
            $table->unsignedInteger('sort')->default(100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('attributes')) {
            return;
        }

        Schema::dropIfExists('attributes');
    }
};
