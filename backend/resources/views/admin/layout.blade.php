<!doctype html>
<html lang="sr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>@yield('title', 'Admin')</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 0; background:#f6f7fb; }
    header { background:#c00000; color:#fff; padding:14px 18px; display:flex; gap:14px; align-items:center; }
    header a { color:#fff; text-decoration:none; opacity:.95; }
    header a:hover { opacity:1; text-decoration:underline; }
    .wrap { max-width: 1100px; margin: 18px auto; padding: 0 14px; }
    .card { background:#fff; border-radius:14px; padding:16px; box-shadow: 0 8px 30px rgba(0,0,0,.06); }
    .row { display:flex; gap:12px; flex-wrap:wrap; }
    input, button { padding:10px 12px; border-radius:12px; border:1px solid #e7e7ef; font-size:14px; }
    button { background:#c00000; color:#fff; border:none; cursor:pointer; }
    button.secondary { background:#111; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:10px; border-bottom:1px solid #eee; text-align:left; }
    small.muted { color:#666; }
    .ok { background:#e8fff0; padding:10px 12px; border-radius:12px; border:1px solid #bff2ce; }
  </style>
</head>
<body>
  <header>
    <strong>SHOP Admin</strong>
    <a href="/admin">Dashboard</a>
    <a href="/admin/proizvodi">Proizvodi</a>
  </header>

  <div class="wrap">
    @if(session('ok'))
      <div class="ok">{{ session('ok') }}</div><br />
    @endif

    @yield('content')
  </div>
</body>
</html>
