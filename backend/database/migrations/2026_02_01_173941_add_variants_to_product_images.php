<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('product_images', function (Blueprint $table) {
      if (!Schema::hasColumn('product_images', 'thumb_url')) $table->string('thumb_url', 600)->nullable();
      if (!Schema::hasColumn('product_images', 'grid_url'))  $table->string('grid_url', 600)->nullable();
      if (!Schema::hasColumn('product_images', 'pdp_url'))   $table->string('pdp_url', 600)->nullable();

      // opciono ali korisno za CLS/SEO
      if (!Schema::hasColumn('product_images', 'width'))  $table->integer('width')->nullable();
      if (!Schema::hasColumn('product_images', 'height')) $table->integer('height')->nullable();
    });
  }

  public function down(): void
  {
    // namerno prazno
  }
};
