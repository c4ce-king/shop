<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminTokenMiddleware
{
  public function handle(Request $request, Closure $next)
  {
    $token = $request->header('x-admin-token');

    if (!$token) {
      $token = $request->cookie('admin_token');
    }

    if (!$token) {
      $token = $request->query('admin_token');
      // ako je poslat kroz query, upiši cookie da ne kucaš stalno
      if ($token) {
        cookie()->queue(cookie('admin_token', $token, 60 * 24 * 30, '/')); // 30 dana
      }
    }

    $valid = env('ADMIN_TOKEN');

    if (!$valid || !$token || !hash_equals($valid, $token)) {
      return response()->json(['poruka' => 'Nije autorizovano'], 401);
    }

    return $next($request);
  }
}
