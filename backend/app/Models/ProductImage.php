<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'url',        // ORIGINAL (putanja)
        'thumb_url',  // WEBP 80
        'grid_url',   // WEBP 300
        'pdp_url',    // WEBP 1200
        'alt',
        'sort_order',
        'width',
        'height',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
