<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\ShopApiController;
use App\Http\Controllers\CatalogController;

use App\Http\Controllers\Admin\ProductAdminController;
use App\Http\Controllers\Admin\ProductImageAdminController;

Route::get('/ping', fn () => response()->json(['ok' => true, 'app' => 'shop-backend']));

// Search autocomplete sugestije
Route::get('/pretraga/sugestije', [ShopApiController::class, 'sugestije']);

// Kategorije tree (za mega meni)
Route::get('/categories/tree', [CatalogController::class, 'categoriesTree']);

// Resolve path -> category/product/home
Route::get('/resolve', [CatalogController::class, 'resolve']);

// Product endpoint (MVP za PDP)
Route::get('/product/{slug}', [CatalogController::class, 'productBySlug']);

// Category listing products (SEO slug path može biti dubok: parent/child/child)
Route::get('category/{slug_path}/products', [CatalogController::class, 'categoryProducts'])
    ->where('slug_path', '.*');

// -------------------- ADMIN --------------------
Route::middleware('admin.token')->prefix('admin')->group(function () {
    Route::get('/test', fn () => response()->json(['ok' => true]));

    Route::get('/proizvodi', [ProductAdminController::class, 'lista']);
    Route::post('/proizvodi', [ProductAdminController::class, 'kreiraj']);
    Route::get('/proizvodi/{id}', [ProductAdminController::class, 'jedan']);
    Route::put('/proizvodi/{id}', [ProductAdminController::class, 'izmeni']);

    Route::get('/proizvodi/{id}/slike', [ProductImageAdminController::class, 'lista']);
    Route::post('/proizvodi/{id}/slike', [ProductImageAdminController::class, 'upload']);
    Route::put('/proizvodi/{id}/slike/redosled', [ProductImageAdminController::class, 'redosled']);
    Route::delete('/slike/{slikaId}', [ProductImageAdminController::class, 'obrisi']);
});

// -------------------- DEBUG (opciono) --------------------
Route::post('/debug', function (Request $request) {
    return response()->json([
        'content_type' => $request->header('content-type'),
        'accept' => $request->header('accept'),
        'raw' => $request->getContent(),
        'json' => $request->json()->all(),
        'all' => $request->all(),
    ]);
});
