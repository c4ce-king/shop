<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductImageAdminController extends Controller
{
  // veličine (MVP)
  private int $sirinaThumb = 160;
  private int $sirinaGrid  = 360;
  private int $sirinaPdp   = 900;

  public function lista($id) {
    $proizvod = Product::findOrFail($id);
    $slike = ProductImage::where('product_id', $proizvod->id)
      ->orderBy('sort_order')
      ->get(['id','url','thumb_url','grid_url','pdp_url','alt','sort_order','width','height']);

    return response()->json(['slike' => $slike]);
  }

  public function upload(Request $request, $id) {
    $proizvod = Product::findOrFail($id);

    $request->validate([
      'file' => 'required|image|mimes:jpeg,jpg,png,webp|max:6144',
      'alt'  => 'nullable|string|max:255',
    ]);

    $fajl = $request->file('file');
    $alt = $request->input('alt');

    // public/uploads/proizvodi/{id}/
    $folderRel = 'uploads/proizvodi/' . $proizvod->id;
    $folderAbs = public_path($folderRel);

    if (!is_dir($folderAbs)) {
      mkdir($folderAbs, 0755, true);
    }

    // Redosled (uzmi pre imenovanja fajla)
    $poslednja = ProductImage::where('product_id', $proizvod->id)
      ->orderByDesc('sort_order')
      ->first();

    $redosled = ($poslednja?->sort_order ?? -1) + 1;

    // Ekstenzija originala (original čuvamo kako je uploadovan)
    $ekst = strtolower($fajl->getClientOriginalExtension() ?: 'webp');
    if (!in_array($ekst, ['jpg','jpeg','png','webp'], true)) {
      $ekst = 'webp';
    }

    // SEO-friendly naziv originala: {slug}-{id}-{redosled}-{rand}.{ext}
    $slugBaza = Str::slug($proizvod->slug ?: $proizvod->title ?: 'proizvod');
    $rand = Str::lower(Str::random(8));
    $naziv = "{$slugBaza}-{$proizvod->id}-{$redosled}-{$rand}.{$ekst}";

    // Snimi original
    $fajl->move($folderAbs, $naziv);

    $urlOriginal = '/' . $folderRel . '/' . $naziv;
    $putanjaOriginal = $folderAbs . DIRECTORY_SEPARATOR . $naziv;

    // dimenzije originala (za CLS/SEO)
    [$w, $h] = $this->dimenzijeSlike($putanjaOriginal);

    // Napravi WebP varijante
    $osnova = pathinfo($naziv, PATHINFO_FILENAME);

    $thumbNaziv = "{$osnova}__thumb.webp";
    $gridNaziv  = "{$osnova}__grid.webp";
    $pdpNaziv   = "{$osnova}__pdp.webp";

    $thumbAbs = $folderAbs . DIRECTORY_SEPARATOR . $thumbNaziv;
    $gridAbs  = $folderAbs . DIRECTORY_SEPARATOR . $gridNaziv;
    $pdpAbs   = $folderAbs . DIRECTORY_SEPARATOR . $pdpNaziv;

    // generiši samo ako može da učita sliku
    $this->kreirajWebpVarijantu($putanjaOriginal, $thumbAbs, $this->sirinaThumb);
    $this->kreirajWebpVarijantu($putanjaOriginal, $gridAbs,  $this->sirinaGrid);
    $this->kreirajWebpVarijantu($putanjaOriginal, $pdpAbs,   $this->sirinaPdp);

    $thumbUrl = '/' . $folderRel . '/' . $thumbNaziv;
    $gridUrl  = '/' . $folderRel . '/' . $gridNaziv;
    $pdpUrl   = '/' . $folderRel . '/' . $pdpNaziv;

    $slika = ProductImage::create([
      'product_id' => $proizvod->id,
      'url' => $urlOriginal,
      'thumb_url' => $thumbUrl,
      'grid_url' => $gridUrl,
      'pdp_url' => $pdpUrl,
      'alt' => $alt,
      'sort_order' => $redosled,
      'width' => $w,
      'height' => $h,
    ]);

    // prva slika = main (postavi na grid radi brzine)
    if ($redosled === 0) {
      $proizvod->main_image_url = $gridUrl ?: $urlOriginal;
      $proizvod->save();
    }

    return response()->json($slika);
  }

  public function redosled(Request $request, $id) {
    $proizvod = Product::findOrFail($id);
    $ids = $request->input('ids');

    if (!is_array($ids) || count($ids) === 0) {
      return response()->json(['poruka' => 'Nedostaje ids'], 400);
    }

    foreach ($ids as $indeks => $slikaId) {
      ProductImage::where('id', $slikaId)
        ->where('product_id', $proizvod->id)
        ->update(['sort_order' => (int)$indeks]);
    }

    $prva = ProductImage::where('product_id', $proizvod->id)->orderBy('sort_order')->first();
    $proizvod->main_image_url = $prva?->grid_url ?: $prva?->url;
    $proizvod->save();

    return response()->json(['ok' => true]);
  }

  public function obrisi($slikaId) {
    $slika = ProductImage::findOrFail($slikaId);
    $proizvodId = $slika->product_id;

    // obriši fajlove (original + varijante)
    $this->obrisiFajlPoUrl($slika->url);
    $this->obrisiFajlPoUrl($slika->thumb_url);
    $this->obrisiFajlPoUrl($slika->grid_url);
    $this->obrisiFajlPoUrl($slika->pdp_url);

    $slika->delete();

    // reindeks sort_order
    $preostale = ProductImage::where('product_id', $proizvodId)->orderBy('sort_order')->get(['id']);
    foreach ($preostale as $i => $s) {
      ProductImage::where('id', $s->id)->update(['sort_order' => $i]);
    }

    // setuj main na prvu
    $prva = ProductImage::where('product_id', $proizvodId)->orderBy('sort_order')->first();
    Product::where('id', $proizvodId)->update(['main_image_url' => $prva?->grid_url ?: $prva?->url]);

    return response()->json(['ok' => true]);
  }

  // --------------------------
  // Pomoćne funkcije (GD)
  // --------------------------

  private function obrisiFajlPoUrl(?string $url): void
  {
    if (!$url) return;
    $putanja = public_path(ltrim($url, '/'));
    if (is_file($putanja)) @unlink($putanja);
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

    // Ako je original manji od cilja, zadrži originalne dimenzije
    $novaSirina = min($ciljSirina, $w);
    $novaVisina = (int) round(($h / $w) * $novaSirina);

    $dst = imagecreatetruecolor($novaSirina, $novaVisina);

    // transparentnost (za PNG/WebP)
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $novaSirina, $novaVisina, $transparent);

    imagecopyresampled($dst, $src, 0, 0, 0, 0, $novaSirina, $novaVisina, $w, $h);

    // kvalitet WebP (0-100)
    @imagewebp($dst, $destAbs, 82);

    imagedestroy($src);
    imagedestroy($dst);
  }

  private function ucitajSliku(string $putanja)
  {
    $ekst = strtolower(pathinfo($putanja, PATHINFO_EXTENSION));

    try {
      return match ($ekst) {
        'jpg', 'jpeg' => @imagecreatefromjpeg($putanja),
        'png'        => @imagecreatefrompng($putanja),
        'webp'       => @imagecreatefromwebp($putanja),
        default      => null,
      };
    } catch (\Throwable $e) {
      return null;
    }
  }
}
