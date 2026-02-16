\# SHOP – HANDOFF (copy/paste u novi chat)



\## Stack

\- Windows + XAMPP

\- Backend: Laravel (backend/)

\- Frontend: Next.js + React Query (frontend/)



\## Pravila

\- Uvek šalji CELE fajlove za copy/paste.

\- UI pravac: MIC (made-in-china.com-like), B2C + B2B (B2B gated).



\## Trenutno stanje (popunjavaš pre novog chata)

\- Branch: <upiši>

\- HEAD commit: <upiši>

\- Git status: clean / dirty (navedi)



\## Implementirano do sada

\- Listing filteri: URL sync (SR ključevi + EN kompatibilnost), facets, sort, page, perPage, view (grid/list)

\- Mini galerije na karticama + list view

\- Product page + lightbox (ESC, strelice)

\- Mobile bottom bar (filteri + controls)

\- Header + MobileMenuDrawer + MegaMenu desktop



\## API / Backend endpoints

\- GET /api/category/{slug\_path}/products

\- GET /api/resolve?path=...

\- GET /api/product/{slug}

\- Admin: /api/admin/\* (header x-admin-token)



\## Poznate mine / napomene

\- React Query: mora QueryClientProvider u layout/providers

\- Hydration mismatch: paziti na locale (Intl), random, Date.now, SSR/client razlike

\- Tailwind v4: postcss config mora koristiti @tailwindcss/postcss plugin



\## Sledeći paket (#4)

\- Product page polish: layout, sticky CTA, spec table, lightbox polish, skeleton/perf

\- B2B gating: samo verifikovani user-i vide B2B cene/sekcije

\- Admin: upravljanje facet-ima po kategoriji (add/remove/reorder)



