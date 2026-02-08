<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShopApiController extends Controller
{
  public function sugestije(Request $request) {
    $upit = trim((string)$request->query('q',''));
    $limit = min((int)$request->query('limit', 8), 12);

    if (mb_strlen($upit) < 2) return response()->json(['sugestije' => []]);

    $tokeni = preg_split('/\s+/', $upit);
    $tokeni = array_slice(array_filter($tokeni), 0, 5);
    $boolean = implode(' ', array_map(fn($t) => $t . '*', $tokeni));

    $rez = DB::table('products')
      ->select('id','slug','title','price_rsd','compare_at_rsd','is_on_sale','main_image_url')
      ->where('is_active', 1)
      ->whereRaw('MATCH(title, rezime, opis_html) AGAINST (? IN BOOLEAN MODE)', [$boolean])
      ->orderByRaw('MATCH(title, rezime, opis_html) AGAINST (? IN BOOLEAN MODE) DESC', [$boolean])
      ->orderByDesc('is_on_sale')
      ->orderByDesc('updated_at')
      ->limit($limit)
      ->get();

    $sugestije = $rez->map(fn($p) => [
      'id' => $p->id,
      'slug' => $p->slug,
      'naslov' => $p->title,
      'cenaRsd' => (int)$p->price_rsd,
      'staraCenaRsd' => $p->compare_at_rsd !== null ? (int)$p->compare_at_rsd : null,
      'naAkciji' => (bool)$p->is_on_sale,
      'slikaUrl' => $p->main_image_url,
    ]);

    return response()->json(['sugestije' => $sugestije]);
  }
}
