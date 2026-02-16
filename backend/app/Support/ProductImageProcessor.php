<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

final class ProductImageProcessor
{
    public static int $thumbWidth = 160;
    public static int $gridWidth  = 360;
    public static int $pdpWidth   = 900;

    /**
     * Snima original + pravi webp varijante (thumb/grid/pdp) na disk('public').
     * Vraća relativne putanje (bez /storage prefiksa).
     *
     * @return array{
     *   original_rel: string,
     *   thumb_rel: string,
     *   grid_rel: string,
     *   pdp_rel: string,
     *   width: ?int,
     *   height: ?int
     * }
     */
    public static function storeAndGenerate(int $productId, UploadedFile $file, string $baseNameNoExt): array
    {
        $disk = Storage::disk('public');

        $folderRel = "uploads/proizvodi/{$productId}";
        $disk->makeDirectory($folderRel);

        // original (čuvamo kako je uploadovan)
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $ext = 'jpg';
        }

        $originalRel = "{$folderRel}/{$baseNameNoExt}.{$ext}";
        $disk->putFileAs($folderRel, $file, "{$baseNameNoExt}.{$ext}");

        $originalAbs = $disk->path($originalRel);

        [$w, $h] = self::getImageSize($originalAbs);

        // webp varijante
        $thumbRel = "{$folderRel}/{$baseNameNoExt}__thumb.webp";
        $gridRel  = "{$folderRel}/{$baseNameNoExt}__grid.webp";
        $pdpRel   = "{$folderRel}/{$baseNameNoExt}__pdp.webp";

        self::ensureWebpSupport();

        self::createWebpVariant($originalAbs, $disk->path($thumbRel), self::$thumbWidth);
        self::createWebpVariant($originalAbs, $disk->path($gridRel),  self::$gridWidth);
        self::createWebpVariant($originalAbs, $disk->path($pdpRel),   self::$pdpWidth);

        return [
            'original_rel' => $originalRel,
            'thumb_rel' => $thumbRel,
            'grid_rel' => $gridRel,
            'pdp_rel' => $pdpRel,
            'width' => $w,
            'height' => $h,
        ];
    }

    public static function toPublicUrl(?string $pathOrUrl): ?string
    {
        if (!$pathOrUrl) return null;

        // Ako je već URL sa leading slash (/uploads/... ili /storage/...), vrati kako jeste
        if (str_starts_with($pathOrUrl, '/')) return $pathOrUrl;

        // Inače tretiraj kao relativnu putanju na disk('public')
        return Storage::disk('public')->url($pathOrUrl);
    }

    public static function deleteIfExists(?string $pathOrUrl): void
    {
        if (!$pathOrUrl) return;

        // Ako je /storage/... ili relativna -> disk('public')
        if (!str_starts_with($pathOrUrl, '/uploads/')) {
            $rel = ltrim($pathOrUrl, '/');
            // ako je /storage/foo.jpg -> foo.jpg
            $rel = preg_replace('#^storage/#', '', $rel) ?? $rel;
            Storage::disk('public')->delete($rel);
            return;
        }

        // Legacy: /uploads/... je bio direktno u public
        $abs = public_path(ltrim($pathOrUrl, '/'));
        if (is_file($abs)) @unlink($abs);
    }

    // --------------------------
    // GD helpers
    // --------------------------

    private static function ensureWebpSupport(): void
    {
        if (!function_exists('imagewebp')) {
            throw new \RuntimeException('GD WebP nije podržan: function imagewebp() ne postoji. Omogući GD WebP ili koristi Imagick.');
        }
    }

    private static function getImageSize(string $abs): array
    {
        $info = @getimagesize($abs);
        if (!$info) return [null, null];
        return [$info[0] ?? null, $info[1] ?? null];
    }

    private static function createWebpVariant(string $srcAbs, string $destAbs, int $targetWidth): void
    {
        $src = self::loadImage($srcAbs);
        if (!$src) return;

        $w = imagesx($src);
        $h = imagesy($src);

        if ($w <= 0 || $h <= 0) {
            imagedestroy($src);
            return;
        }

        $newW = min($targetWidth, $w);
        $newH = (int) round(($h / $w) * $newW);

        $dst = imagecreatetruecolor($newW, $newH);

        // transparentnost (za PNG/WebP)
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $newW, $newH, $transparent);

        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);

        @imagewebp($dst, $destAbs, 82);

        imagedestroy($src);
        imagedestroy($dst);
    }

    private static function loadImage(string $abs)
    {
        $ext = strtolower(pathinfo($abs, PATHINFO_EXTENSION));

        try {
            return match ($ext) {
                'jpg', 'jpeg' => @imagecreatefromjpeg($abs),
                'png'        => @imagecreatefrompng($abs),
                'webp'       => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($abs) : null,
                default      => null,
            };
        } catch (\Throwable $e) {
            return null;
        }
    }
}
