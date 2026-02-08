<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminPageController;

// (Opcionalno) root placeholder — možeš kasnije promeniti ili obrisati
Route::get('/', function () {
  return response()->json(['ok' => true, 'app' => 'shop-backend']);
});

// ADMIN UI (browser)
Route::middleware(['admin.token'])->prefix('admin')->group(function () {
  Route::get('/', [AdminPageController::class, 'dashboard']);

  Route::get('/proizvodi', [AdminPageController::class, 'proizvodiLista']);
  Route::get('/proizvodi/{id}/izmena', [AdminPageController::class, 'proizvodiIzmena']);
  Route::post('/proizvodi/{id}/izmena', [AdminPageController::class, 'proizvodiSnimi']);

  Route::get('/proizvodi/{id}/slike', [AdminPageController::class, 'slikeStrana']);
  Route::post('/proizvodi/{id}/slike/upload', [AdminPageController::class, 'slikeUpload']);
  Route::post('/proizvodi/{id}/slike/redosled', [AdminPageController::class, 'slikeRedosled']);
  Route::post('/slike/{slikaId}/obrisi', [AdminPageController::class, 'slikeObrisi']);
});
