<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Mews\Purifier\Facades\Purifier;

class ProductAdminController extends Controller
{
  public function lista() {
    $proizvodi = Product::query()
      ->orderByDesc('updated_at')
      ->limit(100)
      ->get(['id','title','slug','price_rsd','compare_at_rsd','is_on_sale','is_active','in_stock','main_image_url','updated_at']);

    return response()->json(['proizvodi' => $proizvodi]);
  }

  public function kreiraj(Request $request) {
    $request->validate([
      'title' => 'required|string|max:255',
      'price_rsd' => 'nullable|integer|min:0',
    ]);

    $naslov = (string) $request->input('title');
    $slug = Str::slug($naslov);

    // osiguraj unique slug
    $osnovni = $slug;
    $broj = 2;
    while (Product::where('slug', $slug)->exists()) {
      $slug = $osnovni . '-' . $broj;
      $broj++;
    }

    $proizvod = Product::create([
      'title' => $naslov,
      'slug' => $slug,
      'price_rsd' => (int) $request->input('price_rsd', 0),
      'is_active' => true,
      'in_stock' => true,
      'is_on_sale' => false,
    ]);

    // auto SEO (možeš menjati kasnije u adminu)
    $proizvod->seo_title = $proizvod->title;
    $proizvod->seo_description = $proizvod->rezime ?? null;
    $proizvod->save();

    return response()->json($proizvod);
  }

  public function jedan($id) {
    $proizvod = Product::with('slike')->findOrFail($id);
    return response()->json($proizvod);
  }

  public function izmeni(Request $request, $id) {
    $proizvod = Product::findOrFail($id);

    $opisHtml = $request->input('opis_html');
    $cistOpis = is_string($opisHtml) ? Purifier::clean($opisHtml, 'shop') : null;

    $proizvod->fill([
      'title' => $request->input('title', $proizvod->title),
      'slug' => $request->input('slug', $proizvod->slug),
      'rezime' => $request->input('rezime', $proizvod->rezime),
      'opis_html' => $cistOpis ?? $proizvod->opis_html,

      'price_rsd' => $request->input('price_rsd') !== null ? (int)$request->input('price_rsd') : $proizvod->price_rsd,
      'compare_at_rsd' => $request->input('compare_at_rsd') !== null ? (int)$request->input('compare_at_rsd') : null,
      'is_on_sale' => (bool) $request->input('is_on_sale', $proizvod->is_on_sale),
      'is_active' => (bool) $request->input('is_active', $proizvod->is_active),
      'in_stock' => (bool) $request->input('in_stock', $proizvod->in_stock),

      // SEO (editable)
      'seo_title' => $request->input('seo_title', $proizvod->seo_title),
      'seo_description' => $request->input('seo_description', $proizvod->seo_description),
      'canonical_url' => $request->input('canonical_url', $proizvod->canonical_url),
      'og_title' => $request->input('og_title', $proizvod->og_title),
      'og_description' => $request->input('og_description', $proizvod->og_description),
      'og_image_url' => $request->input('og_image_url', $proizvod->og_image_url),
      'twitter_card' => $request->input('twitter_card', $proizvod->twitter_card),
      'noindex' => (bool) $request->input('noindex', $proizvod->noindex),
    ]);

    // logika akcije: ako je na akciji, mora imati compare_at_rsd
    if ($proizvod->is_on_sale && (!$proizvod->compare_at_rsd || $proizvod->compare_at_rsd <= $proizvod->price_rsd)) {
      return response()->json(['poruka' => 'Za akciju mora postojati stara cena veca od nove'], 422);
    }

    $proizvod->save();

    return response()->json($proizvod);
  }
}
