# SHOP – HANDOFF (copy/paste u novi chat)

## Stack
- Windows + XAMPP
- Backend: Laravel (backend/)
- Frontend: Next.js 16.1.6 (Turbopack) + React Query (frontend/)

## Pravila
- Uvek šalji CELE fajlove za copy/paste.
- UI pravac: MIC (made-in-china.com-like), B2C + B2B (B2B gated) — trenutno radimo B2C fokus, ali estetika ostaje MIC.
- Valuta: RSD uvek kao `12.990 RSD` (sr-RS format), bez dupliranja “RSD”.

## Trenutno stanje (popunjavaš pre novog chata)
- Branch: <upiši>
- HEAD commit: <upiši>
- Tag snapshot (ako postoji): <upiši>
- Git status: clean / dirty (navedi)

## Implementirano do sada
- Listing UI: grid + list, MIC-ish styling.
- Filteri: sticky sidebar (bez scrollovanja panela), chipovi iznad listing-a (desktop + mobile).
- Sort / Po strani: MicSelect (Radix Select), fancy dropdown.
- Pagination: “Prva/Prethodna/…/Sledeća/Poslednja”, sa “…” kad je mnogo strana.
- Backend category branch fix: descendantIds uvek uključuje self + fallback po slug_path LIKE 'prefix/%' (da obuhvati podkategorije). Pagination total radi.
- Frontend pagination source of truth: koristi data.pagination {page, per_page, total}.
- useCategoryProducts: šalje page + per_page uvek + šalje dynamic facets; normalizuje images.
- Debug bar/log uklonjeni; CategoryListingClient.tsx final (UTF-8 fix ranije).

## API / Backend endpoints
- GET /api/category/{slug_path}/products
- GET /api/resolve?path=...
- GET /api/product/{slug}
- Admin: /api/admin/* (header x-admin-token)

## Listing “pills + price stack” (WIP paket)
Cilj (MIC-like):
- Grid view: pill bar na dnu slike u JEDNOM redu:
  - popust: samo “-xx%” (crveno, upadljivo)
  - stanje: zeleno “Na stanju”, narandžasto “Pri kraju zaliha”, crveno “Nema na stanju”
- Price stack: nova cena + stara cena ispod precrtana (ako postoji).
- Stabilan layout: “Isporuka: 1–3 dana” mora biti u istoj ravni bez obzira na to da li postoji stara cena ili ne.
- MIC-like switching slika: chevrons + dots (grid i list).

Status:
- Backend već može da vrati: price_rsd, old_price_rsd, percent_off, is_sale, in_stock (bool), images[].
- Popust testiran: ručno setovan za id=118 => API vraća percent_off=25, old_price_rsd != null.

## Problem koji nas je blokirao (VAŽNO)
- Napravljen migration: `backend/database/migrations/2026_02_22_100408_add_stock_qty_to_products_table.php`
- Ali migration je PRAZAN (up/down imaju `//`), pa kolona nije dodata.
- Zato nakon `php artisan migrate`:
  - `Schema::hasColumn('products', 'stock_qty')` vraća false
  - update failuje: “Unknown column stock_qty”
- Rešenje: popuniti migration da stvarno doda kolonu, pa migrate (ili new migration + drop stari).

## Sledeći koraci (redosled)
1) Fix migration za stock_qty:
   - `stock_qty` (unsignedSmallInteger, default 0) + index (opciono)
   - migrate
   - (opciono) backfill: stock_qty = in_stock ? 10 : 0
2) Backend: u products response dodati `stock_qty` i/ili `stock_status` (derived):
   - if stock_qty >= 4 => “in_stock”
   - if 1..3 => “low_stock”
   - if 0 => “out_of_stock”
3) Frontend: koristiti percent_off / old_price_rsd / stock_qty za pillove + stabilan layout.

## Poznate mine / napomene
- React Query: mora QueryClientProvider u layout/providers
- Hydration mismatch: paziti na locale (Intl), random, Date.now, SSR/client razlike
- Tailwind v4: postcss config mora koristiti @tailwindcss/postcss plugin
- Next dev: može tražiti `allowedDevOrigins` ako blokira ws/hmr na 127.0.0.1

## Dev komande
Backend:
- cd backend
- php artisan migrate:status
- php artisan migrate
- php artisan tinker

Frontend:
- cd frontend
- npm ci
- npm run dev