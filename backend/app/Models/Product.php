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

        // Legacy fields (ostavljeno radi backward compat dok ne pređemo full na pricing service)
        'price_rsd',
        'compare_at_rsd',
        'is_on_sale',

        // New pricing inputs (source-of-truth ulazi)
        'cost_rsd',

        'mp_margin_percent',
        'mp_margin_fixed_rsd',

        'vp_margin_percent',
        'vp_margin_fixed_rsd',

        'vat_percent',

        'mp_discount_active',
        'mp_discount_percent',
        'mp_discount_fixed_rsd',

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

    protected $casts = [
        // Legacy
        'is_on_sale' => 'boolean',
        'price_rsd' => 'integer',
        'compare_at_rsd' => 'integer',

        // Flags
        'is_active' => 'boolean',
        'in_stock' => 'boolean',
        'noindex' => 'boolean',

        // Pricing
        'cost_rsd' => 'integer',

        'mp_margin_percent' => 'decimal:2',
        'mp_margin_fixed_rsd' => 'integer',

        'vp_margin_percent' => 'decimal:2',
        'vp_margin_fixed_rsd' => 'integer',

        'vat_percent' => 'decimal:2',

        'mp_discount_active' => 'boolean',
        'mp_discount_percent' => 'decimal:2',
        'mp_discount_fixed_rsd' => 'integer',
    ];

    public function slike(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_id')->orderBy('sort_order');
    }
}
