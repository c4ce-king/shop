<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StockAlertController extends Controller
{
    public function create(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'min:1'],
            'email' => ['required', 'string', 'max:190'],
            'phone' => ['nullable', 'string', 'max:50'],
            'note' => ['nullable', 'string', 'max:500'],
            'source' => ['nullable', 'string', 'max:50'],
        ]);

        // basic email sanity (Laravel email rule sometimes too strict for some users; keep light)
        $email = trim((string)($data['email'] ?? ''));
        if ($email === '' || strpos($email, '@') === false) {
            return response()->json(['message' => 'Neispravan email.'], 422);
        }

        $productId = (int)$data['product_id'];

        // Verify product exists
        if (!Schema::hasTable('products')) {
            return response()->json(['message' => 'Products tabela ne postoji.'], 500);
        }

        $exists = DB::table('products')->where('id', $productId)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Proizvod nije pronađen.'], 404);
        }

        // Optional: avoid spamming duplicates (same product+email within last X minutes)
        $recentDup = DB::table('stock_alerts')
            ->where('product_id', $productId)
            ->where('email', $email)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->exists();

        if ($recentDup) {
            return response()->json([
                'ok' => true,
                'message' => 'Već imamo tvoju prijavu (skorašnja).',
            ], 200);
        }

        $id = DB::table('stock_alerts')->insertGetId([
            'product_id' => $productId,
            'email' => $email,
            'phone' => isset($data['phone']) && trim((string)$data['phone']) !== '' ? trim((string)$data['phone']) : null,
            'note' => isset($data['note']) && trim((string)$data['note']) !== '' ? trim((string)$data['note']) : null,
            'ip' => (string)$request->ip(),
            'user_agent' => substr((string)$request->userAgent(), 0, 255),
            'source' => isset($data['source']) ? (string)$data['source'] : 'pdp',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'id' => (int)$id,
            'message' => 'Prijava sačuvana. Javićemo ti kada bude dostupno.',
        ]);
    }
}
