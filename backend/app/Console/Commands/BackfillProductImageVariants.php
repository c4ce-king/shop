<?php

namespace App\Console\Commands;

use App\Models\ProductImage;
use Illuminate\Console\Command;

class BackfillProductImageVariants extends Command
{
  protected $signature = 'shop:backfill-variants {productId?}';
  protected $description = 'Generise thumb/grid/pdp varijante za postojece slike koje ih nemaju';

  private int $sirinaThumb = 160;
  private int $sirinaGrid  = 360;
  private int $sirinaPdp   = 900;

  public function handle(): int
  {
    $productId = $this->argument('productId');

    $q = ProductImage::query()->whereNull('thumb_url');

    if ($productId) {
      $q->where('product_id', (int)$productId);
    }

    $slike = $q->orderBy('product_id')->orderBy('sort_order')->get();

    if ($slike->isEmpty()) {
      $this->info('Nema slika za backfill (thumb_url nije NULL).');
      return self::SUCCESS;
    }

    $this->info('Backfill count: ' . $slike->count());

    foreach ($slike as $slika) {
      $urlOriginal = $slika->url;
      if (!$urlOriginal) continue;

      $srcAbs = public_path(ltrim($urlOriginal, '/'));
      if (!is_file($srcAbs)) {
        $this->warn("Fajl ne postoji: {$srcAbs}");
        continue;
      }

      $dirRel = trim(dirname(ltrim($urlOriginal, '/')), '/'); // uploads/proizvodi/{id}
      $dirAbs = public_path($dirRel);

      $filename = basename($srcAbs);
      $osnova = pathinfo($filename, PATHINFO_FILENAME);

      $thumbNaziv = "{$osnova}__thumb.webp";
      $gridNaziv  = "{$osnova}__grid.webp";
      $pdpNaziv   = "{$osnova}__pdp.webp";

      $thumbAbs = $dirAbs . DIRECTORY_SEPARATOR . $thumbNaziv;
      $gridAbs  = $dirAbs . DIRECTORY_SEPARATOR . $gridNaziv;
      $pdpAbs   = $dirAbs . DIRECTORY_SEPARATOR . $pdpNaziv;

      [$w, $h] = $this->dimenzijeSlike($srcAbs);

      $this->kreirajWebpVarijantu($srcAbs, $thumbAbs, $this->sirinaThumb);
      $this->kreirajWebpVarijantu($srcAbs, $gridAbs,  $this->sirinaGrid);
      $this->kreirajWebpVarijantu($srcAbs, $pdpAbs,   $this->sirinaPdp);

      $slika->thumb_url = '/' . $dirRel . '/' . $thumbNaziv;
      $slika->grid_url  = '/' . $dirRel . '/' . $gridNaziv;
      $slika->pdp_url   = '/' . $dirRel . '/' . $pdpNaziv;
      $slika->width = $w;
      $slika->height = $h;
      $slika->save();

      $this->info("OK slika_id={$slika->id} product_id={$slika->product_id}");
    }

    return self::SUCCESS;
  }

  private function dimenzijeSlike(string $putanja): array
  {
    $info = @getimagesize($putanja);
    if (!$info) return [null, null];
    return [$info[0] ?? null, $info[1] ?? null];
  }

  private function kreirajWebpVarijantu(string $srcAbs, string $destAbs, int $ciljSirina): void
  {
    $src = $this->ucitajSliku($srcAbs);
    if (!$src) return;

    $w = imagesx($src);
    $h = imagesy($src);

    if ($w <= 0 || $h <= 0) {
      imagedestroy($src);
      return;
    }

    $novaSirina = min($ciljSirina, $w);
    $novaVisina = (int) round(($h / $w) * $novaSirina);

    $dst = imagecreatetruecolor($novaSirina, $novaVisina);

    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $novaSirina, $novaVisina, $transparent);

    imagecopyresampled($dst, $src, 0, 0, 0, 0, $novaSirina, $novaVisina, $w, $h);

    @imagewebp($dst, $destAbs, 82);

    imagedestroy($src);
    imagedestroy($dst);
  }

  private function ucitajSliku(string $putanja)
  {
    $ekst = strtolower(pathinfo($putanja, PATHINFO_EXTENSION));

    return match ($ekst) {
      'jpg', 'jpeg' => @imagecreatefromjpeg($putanja),
      'png'        => @imagecreatefrompng($putanja),
      'webp'       => @imagecreatefromwebp($putanja),
      default      => null,
    };
  }
}
