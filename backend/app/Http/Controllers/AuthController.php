<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function me(Request $request)
    {
        $u = $request->user();
        if (!$u) return response()->json(['user' => null], 200);

        return response()->json([
            'user' => [
                'id' => (int)$u->id,
                'email' => (string)$u->email,
                'name' => (string)($u->name ?? ''),
            ],
        ], 200);
    }

    public function register(Request $request)
    {
        // users table must exist
        if (!Schema::hasTable('users')) {
            return response()->json(['message' => 'Users tabela ne postoji.'], 500);
        }

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['required', 'string', 'max:190'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $email = strtolower(trim((string)$data['email']));
        if ($email === '' || strpos($email, '@') === false) {
            throw ValidationException::withMessages(['email' => ['Neispravan email.']]);
        }

        $exists = DB::table('users')->where('email', $email)->exists();
        if ($exists) {
            throw ValidationException::withMessages(['email' => ['Email je već registrovan.']]);
        }

        $id = DB::table('users')->insertGetId([
            'name' => isset($data['name']) ? trim((string)$data['name']) : null,
            'email' => $email,
            'password' => Hash::make((string)$data['password']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // login
        Auth::loginUsingId($id);

        return $this->me($request);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'max:190'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $email = strtolower(trim((string)$data['email']));
        $password = (string)$data['password'];

        if (!Auth::attempt(['email' => $email, 'password' => $password], true)) {
            throw ValidationException::withMessages(['email' => ['Pogrešan email ili lozinka.']]);
        }

        $request->session()->regenerate();

        return $this->me($request);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true], 200);
    }
}
