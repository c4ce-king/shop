<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\ShopApiController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\StockAlertController;
use App\Http\Controllers\AuthController;

use App\Http\Controllers\Admin\ProductAdminController;
use App\Http\Controllers\Admin\ProductImageAdminController;

Route::get('/ping', fn () => response()->json(['ok' => true, 'app' => 'shop-backend']));

Route::get('/pretraga/sugestije', [ShopApiController::class, 'sugestije']);
Route::get('/categories/tree', [CatalogController::class, 'categoriesTree']);
Route::get('/resolve', [CatalogController::class, 'resolve']);
Route::get('/product/{slug}', [CatalogController::class, 'productBySlug']);

Route::get('category/{slug_path}/products', [CatalogController::class, 'categoryProducts'])
    ->where('slug_path', '.*');

// ---- AUTH (Sanctum cookie SPA) ----
Route::get('/auth/me', [AuthController::class, 'me']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

// ---- STOCK ALERTS ----
Route::get('/notify/status', [StockAlertController::class, 'status']);
Route::post('/notify', [StockAlertController::class, 'create'])->middleware('auth:sanctum');

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

// DEBUG
Route::post('/debug', function (Request $request) {
    return response()->json([
        'content_type' => $request->header('content-type'),
        'accept' => $request->header('accept'),
        'raw' => $request->getContent(),
        'json' => $request->json()->all(),
        'all' => $request->all(),
    ]);
});
