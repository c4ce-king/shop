<?php

namespace App\Support;

class ProductPricing
{
    /**
     * Compute pricing for a product.
     *
     * Input can be:
     * - Eloquent model (Product)
     * - stdClass (DB row)
     * - array
     */
    public static function compute($product): array
    {
        $get = function (string $key, $default = null) use ($product) {
            if (is_array($product)) return $product[$key] ?? $default;
            if (is_object($product)) return $product->{$key} ?? $default;
            return $default;
        };

        // Base inputs (robust defaults)
        $cost = self::num($get('cost_rsd', 0));
        $vat = self::num($get('vat_percent', 20));
        if ($vat <= 0) $vat = 20;

        // MP margins (default 20% + 0)
        $mpMarginPct = self::num($get('mp_margin_percent', 20));
        $mpMarginFix = self::num($get('mp_margin_fixed_rsd', 0));

        // VP margins (optional, fallback to 20/0)
        $vpMarginPct = self::num($get('vp_margin_percent', 20));
        $vpMarginFix = self::num($get('vp_margin_fixed_rsd', 0));

        // Legacy action fields (you already have these)
        $isOnSale = (int)($get('is_on_sale', 0) ?? 0) === 1;
        $compareAt = self::num($get('compare_at_rsd', 0));

        // If cost is missing but legacy price exists, derive an approximate cost (demo-friendly).
        // price_rsd here is assumed GROSS.
        if ($cost <= 0) {
            $legacyPriceGross = self::num($get('price_rsd', 0));
            if ($legacyPriceGross > 0) {
                // reverse VAT
                $netFromGross = $legacyPriceGross / (1 + ($vat / 100));
                // reverse margin
                $cost = max(1, round(($netFromGross - $mpMarginFix) / (1 + ($mpMarginPct / 100))));
            }
        }

        // MP Net/Gross (regular, without action)
        $mpNet = self::round0($cost * (1 + ($mpMarginPct / 100)) + $mpMarginFix);
        $mpGross = self::round0($mpNet * (1 + ($vat / 100)));

        // VP Net/Gross
        $vpNet = self::round0($cost * (1 + ($vpMarginPct / 100)) + $vpMarginFix);
        $vpGross = self::round0($vpNet * (1 + ($vat / 100)));

        // Action logic:
        // - main price = MP gross regular
        // - old price = compare_at_rsd only if on_sale AND compare_at > main
        $priceMain = (int)$mpGross;
        $priceOld = 0;
        $save = 0;

        if ($isOnSale && $compareAt > 0 && $compareAt > $priceMain) {
            $priceOld = (int)self::round0($compareAt);
            $save = max(0, $priceOld - $priceMain);
        }

        return [
            'vat_percent' => (int)$vat,

            'retail' => [
                'net_rsd' => (int)$mpNet,
                'gross_rsd' => (int)$mpGross,

                // what FE should display
                'price_main_rsd' => (int)$priceMain,
                'price_old_rsd' => (int)$priceOld,
                'save_rsd' => (int)$save,
                'discount_active' => $save > 0,
            ],

            'wholesale' => [
                'net_rsd' => (int)$vpNet,
                'gross_rsd' => (int)$vpGross,
            ],
        ];
    }

    private static function num($v): float
    {
        if ($v === null || $v === '') return 0.0;
        if (is_bool($v)) return $v ? 1.0 : 0.0;
        if (is_numeric($v)) return (float)$v;
        return 0.0;
    }

    private static function round0(float $v): float
    {
        return round($v, 0);
    }
}
