<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable()->index();

            $table->string('name', 190);
            $table->string('slug', 190);
            // SEO path: parent/child
            $table->string('slug_path', 500)->unique();

            $table->integer('sort')->default(0);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
