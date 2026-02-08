<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;

class AdminPageController extends Controller
{
  public function dashboard()
  {
    return view('admin.dashboard');
  }

  public function proizvodiLista(Request $request)
  {
    $q = trim((string)$request->query('q', ''));

    $proizvodi = Product::query()
      ->when($q !== '', function ($qq) use ($q) {
        $qq->where('title', 'like', "%{$q}%")
           ->orWhere('slug', 'like', "%{$q}%");
      })
      ->orderByDesc('id')
      ->paginate(20)
      ->withQueryString();

    return view('admin.proizvodi-lista', [
      'q' => $q,
      'proizvodi' => $proizvodi,
    ]);
  }

  public function proizvodiIzmena($id)
  {
    $proizvod = Product::findOrFail($id);
    return view('admin.proizvodi-izmena', ['proizvod' => $proizvod]);
  }

  public function proizvodiSnimi(Request $request, $id)
  {
    $proizvod = Product::findOrFail($id);

    $data = $request->validate([
      'title' => 'nullable|string|max:255',
      'price_rsd' => 'required|integer|min:0',
      'compare_at_rsd' => 'nullable|integer|min:0',
      'is_on_sale' => 'nullable|boolean',
      'is_active' => 'nullable|boolean',
      'in_stock' => 'nullable|boolean',

      'seo_title' => 'nullable|string|max:255',
      'seo_description' => 'nullable|string|max:320',
      'noindex' => 'nullable|boolean',
    ]);

    $proizvod->title = $data['title'] ?? $proizvod->title;
    $proizvod->price_rsd = (int)$data['price_rsd'];
    $proizvod->compare_at_rsd = $data['compare_at_rsd'] ?? null;
    $proizvod->is_on_sale = (bool)($data['is_on_sale'] ?? false);
    $proizvod->is_active = (bool)($data['is_active'] ?? false);
    $proizvod->in_stock = (bool)($data['in_stock'] ?? false);

    $proizvod->seo_title = $data['seo_title'] ?? null;
    $proizvod->seo_description = $data['seo_description'] ?? null;
    $proizvod->noindex = (bool)($data['noindex'] ?? false);

    $proizvod->save();

    return redirect("/admin/proizvodi/{$proizvod->id}/izmena")
      ->with('ok', 'Sačuvano');
  }

  public function slikeStrana($id)
  {
    $proizvod = Product::findOrFail($id);

    $slike = ProductImage::where('product_id', $proizvod->id)
      ->orderBy('sort_order')
      ->get();

    return view('admin.slike', [
      'proizvod' => $proizvod,
      'slike' => $slike,
    ]);
  }

  public function slikeUpload(Request $request, $id)
  {
    // Reuse API logike: samo prosledi na postojeći endpoint je opcija,
    // ali za MVP uradićemo direktno isto kao API controller (kasnije refactor).
    $api = app(\App\Http\Controllers\Admin\ProductImageAdminController::class);
    return $api->upload($request, $id);
  }

  public function slikeRedosled(Request $request, $id)
  {
    $api = app(\App\Http\Controllers\Admin\ProductImageAdminController::class);
    return $api->redosled($request, $id);
  }

  public function slikeObrisi($slikaId)
  {
    $api = app(\App\Http\Controllers\Admin\ProductImageAdminController::class);
    return $api->obrisi($slikaId);
  }
}
