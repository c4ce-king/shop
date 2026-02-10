<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProductImageProcessor
{
    /**
     * MIC-style varijante:
     * - thumb: 120x120 (crop)
     * - grid:  480x480 (crop)
     * - pdp:   900x900 (crop)
     * - zoom:  1600x1600 (crop)
     *
     * Sve WEBP, kvalitet 78-82 (balans: oštro + lagano).
     *
     * PLUS: čuvamo original (source) za regeneraciju.
     */
    public static function makeWebpVariants(UploadedFile $file, int $productId, int $sortOrder = 0): array
    {
        // Public disk (storage:link)
        $baseDir = "products/{$productId}";
        $origDir = "{$baseDir}/originals";

        $origExt = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $origMime = $file->getClientMimeType() ?: null;
        $origSize = $file->getSize() ?: null;

        $basename = "img_" . date('Ymd_His') . "_" . substr(sha1($file->getClientOriginalName() . microtime(true)), 0, 10);

        // 1) Save original (source-of-truth)
        $originalPath = "{$origDir}/{$basename}.{$origExt}";
        Storage::disk('public')->putFileAs($origDir, $file, "{$basename}.{$origExt}");

        $originalUrl = Storage::url($originalPath);

        // 2) WEBP variants
        $thumb = "{$baseDir}/{$basename}_thumb.webp";
        $grid  = "{$baseDir}/{$basename}_grid.webp";
        $pdp   = "{$baseDir}/{$basename}_pdp.webp";
        $zoom  = "{$baseDir}/{$basename}_zoom.webp";

        // Prefer Intervention Image if installed
        if (class_exists(\Intervention\Image\Facades\Image::class)) {
            $img = \Intervention\Image\Facades\Image::make($file->getPathname());

            // base meta (ne moramo original dimenzije, ali može pomoći)
            $img->orientate();
            $origW = method_exists($img, 'width') ? $img->width() : null;
            $origH = method_exists($img, 'height') ? $img->height() : null;

            self::encodeSet(\Intervention\Image\Facades\Image::make($file->getPathname()), $thumb, 120, 120, 78);
            self::encodeSet(\Intervention\Image\Facades\Image::make($file->getPathname()), $grid, 480, 480, 78);
            self::encodeSet(\Intervention\Image\Facades\Image::make($file->getPathname()), $pdp, 900, 900, 80);
            self::encodeSet(\Intervention\Image\Facades\Image::make($file->getPathname()), $zoom, 1600, 1600, 82);

            return [
                // ✅ ORIGINAL
                'original_path' => $originalPath,
                'original_url' => $originalUrl,
                'original_ext' => $origExt,
                'original_mime' => $origMime,
                'original_size_bytes' => $origSize,
                'width' => $origW,
                'height' => $origH,

                // ✅ WEBP variants
                'thumb_url_webp' => Storage::url($thumb),
                'grid_url_webp'  => Storage::url($grid),
                'pdp_url_webp'   => Storage::url($pdp),
                'zoom_url_webp'  => Storage::url($zoom),

                'sort_order' => $sortOrder,
            ];
        }

        // No Intervention -> still return original data (we at least stored it)
        return [
            'original_path' => $originalPath,
            'original_url' => $originalUrl,
            'original_ext' => $origExt,
            'original_mime' => $origMime,
            'original_size_bytes' => $origSize,

            'thumb_url_webp' => null,
            'grid_url_webp'  => null,
            'pdp_url_webp'   => null,
            'zoom_url_webp'  => null,

            'width' => null,
            'height' => null,
            'sort_order' => $sortOrder,
        ];
    }

    private static function encodeSet($img, string $path, int $w, int $h, int $quality): void
    {
        $img->orientate();

        // MIC tile crop (centar). Kasnije možemo focal point.
        $img->fit($w, $h, function ($c) {
            $c->upsize();
        });

        if (method_exists($img, 'strip')) {
            $img->strip();
        }

        $binary = (string) $img->encode('webp', $quality);
        Storage::disk('public')->put($path, $binary);
    }
}
