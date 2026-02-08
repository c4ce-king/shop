<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductImage extends Model
{
  protected $fillable = [
    'product_id',
    'url',
    'thumb_url',
    'grid_url',
    'pdp_url',
    'alt',
    'sort_order',
    'width',
    'height',
  ];
}
