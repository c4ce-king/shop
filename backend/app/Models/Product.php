<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $table = 'products';

    protected $fillable = [
        'title',
        'slug',
        'rezime',
        'opis_html',

        'price_rsd',
        'compare_at_rsd',
        'is_on_sale',

        'is_active',
        'in_stock',

        'seo_title',
        'seo_description',
        'canonical_url',
        'og_title',
        'og_description',
        'og_image_url',
        'twitter_card',
        'noindex',

        'main_image_url',
    ];

    public function slike(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_id')->orderBy('sort_order');
    }
}
