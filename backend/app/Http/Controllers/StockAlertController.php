<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StockAlertController extends Controller
{
    public function status(Request $request)
    {
        $u = $request->user();
        if (!$u) return response()->json(['subscribed' => false], 200);

        $pid = (int)$request->query('product_id', 0);
        if ($pid <= 0) return response()->json(['subscribed' => false], 200);

        $exists = DB::table('stock_alerts')
            ->where('user_id', (int)$u->id)
            ->where('product_id', $pid)
            ->exists();

        return response()->json(['subscribed' => (bool)$exists], 200);
    }

    public function create(Request $request)
    {
        $u = $request->user();
        if (!$u) {
            return response()->json(['message' => 'Morate biti ulogovani.'], 401);
        }

        $data = $request->validate([
            'product_id' => ['required', 'integer', 'min:1'],
            'phone' => ['nullable', 'string', 'max:50'],
            'note' => ['nullable', 'string', 'max:500'],
            'source' => ['nullable', 'string', 'max:50'],
        ]);

        $productId = (int)$data['product_id'];

        if (!Schema::hasTable('products')) {
            return response()->json(['message' => 'Products tabela ne postoji.'], 500);
        }

        $exists = DB::table('products')->where('id', $productId)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Proizvod nije pronađen.'], 404);
        }

        // if already subscribed -> return ok
        $already = DB::table('stock_alerts')
            ->where('user_id', (int)$u->id)
            ->where('product_id', $productId)
            ->exists();

        if ($already) {
            return response()->json([
                'ok' => true,
                'message' => 'Bićete obavešteni ✅ kada proizvod ponovo bude dostupan.',
                'already' => true,
            ], 200);
        }

        $id = DB::table('stock_alerts')->insertGetId([
            'user_id' => (int)$u->id,
            'product_id' => $productId,
            'email' => (string)$u->email, // keep for admin visibility
            'phone' => isset($data['phone']) && trim((string)$data['phone']) !== '' ? trim((string)$data['phone']) : null,
            'note' => isset($data['note']) && trim((string)$data['note']) !== '' ? trim((string)$data['note']) : null,
            'ip' => (string)$request->ip(),
            'user_agent' => substr((string)$request->userAgent(), 0, 255),
            'source' => isset($data['source']) ? (string)$data['source'] : 'listing_or_pdp',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'id' => (int)$id,
            'message' => 'Bićete obavešteni ✅ kada proizvod ponovo bude dostupan.',
        ], 200);
    }
}
