"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useProduct } from "@/hooks/useProduct";
import type { ProductImageDTO } from "@/hooks/useCategoryProducts";

function formatRSD(n: number) {
  return new Intl.NumberFormat("sr-RS").format(Math.round(n)) + " RSD";
}

function pickMain(img: ProductImageDTO | undefined | null): string | null {
  if (!img) return null;
  return img.pdp ?? img.grid ?? img.original ?? img.thumb ?? null;
}

function pickThumb(img: ProductImageDTO | undefined | null): string | null {
  if (!img) return null;
  return img.thumb ?? img.grid ?? img.original ?? img.pdp ?? null;
}

export default function ProductPageClient({ slug }: { slug: string }) {
  const q = useProduct(slug);
  const p = q.data;

  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  const images = React.useMemo(() => {
    const arr = Array.isArray(p?.images) ? p!.images!.filter(Boolean) : [];
    const out: ProductImageDTO[] = [];
    const seen = new Set<string>();

    for (const im of arr) {
      const key = pickMain(im) ?? pickThumb(im) ?? "";
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(im);
      if (out.length >= 10) break;
    }
    return out;
  }, [p?.images]);

  const [idx, setIdx] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setIdx(0);
    setOpen(false);
  }, [slug]);

  const canPrev = idx > 0;
  const canNext = idx < images.length - 1;

  const mainUrl = pickMain(images[idx]) ?? null;

  // ESC / arrows
  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") setIdx((x) => Math.max(0, x - 1));
      if (e.key === "ArrowRight") setIdx((x) => Math.min(images.length - 1, x + 1));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (q.isLoading) return <div className="mx-auto max-w-4xl px-4 py-6">Učitavam…</div>;

  if (q.error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
          Greška: {(q.error as Error).message}
        </div>
      </div>
    );
  }

  if (!p) return <div className="mx-auto max-w-4xl px-4 py-6">Nema proizvoda.</div>;

  const pageTitle = `${p.name} — ${formatRSD(p.price_rsd)}`;

const Lightbox = open ? (
  <div
    style={{ position: "fixed", inset: 0, zIndex: 99999 }}
    className="bg-black/80 p-4"
    onClick={() => setOpen(false)} // ✅ klik na backdrop zatvara
    role="dialog"
    aria-modal="true"
    aria-label={`Uvećani prikaz: ${p.name}`}
    title="Klik van slike zatvara"
  >
    {/* ✅ OVAJ WRAPPER VIŠE NE SME da stopPropagation */}
    <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center">
      {/* ✅ STOP PROPAGATION IDE SAMO NA PANEL */}
      <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={() => setOpen(false)}
          aria-label="Zatvori"
          title="Zatvori (ESC)"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative overflow-hidden rounded-2xl bg-black">
          {mainUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainUrl}
              alt={p.name}
              title={p.name}
              className="max-h-[80vh] w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex h-[60vh] items-center justify-center text-sm text-white/70">Nema slike</div>
          )}

          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-40"
                onClick={() => setIdx((x) => Math.max(0, x - 1))}
                disabled={!canPrev}
                aria-label="Prethodna slika"
                title="Prethodna (←)"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-40"
                onClick={() => setIdx((x) => Math.min(images.length - 1, x + 1))}
                disabled={!canNext}
                aria-label="Sledeća slika"
                title="Sledeća (→)"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}
        </div>

        <div className="mt-3 text-center text-xs text-white/70" title="Uputstvo">
          ESC zatvara{images.length > 1 ? " • ← → menja sliku" : ""}
        </div>
      </div>
    </div>
  </div>
) : null;


  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="text-xs text-black/50" title={`Slug: ${slug}`}>
        //{slug}
      </div>

      {/* Debug */}
      <div className="mt-1 text-[11px] text-black/40" title="Debug">
        JS: {hydrated ? "OK" : "NE"} • OPEN: {open ? "DA" : "NE"} • IMAGES: {images.length}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-[520px_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-2xl border bg-white">
            {mainUrl ? (
              <button
                type="button"
                className="block w-full cursor-zoom-in"
                onClick={() => setOpen(true)}
                aria-label="Otvori uvećani prikaz slike"
                title="Klik za uvećanje"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainUrl}
                  alt={p.name}     // ✅ alt (SEO + accessibility)
                  title={p.name}   // ✅ title (kako želiš)
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </button>
            ) : (
              <div className="flex aspect-square items-center justify-center text-sm text-black/50" title="Nema slike">
                Nema slike
              </div>
            )}
          </div>

          {/* thumbnail i kad je 1 slika */}
          {images.length >= 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" title="Galerija slika">
              {images.map((im, i) => {
                const t = pickThumb(im);
                const active = i === idx;
                const tTitle = `${p.name} — slika ${i + 1}`;
                return (
                  <button
                    key={(pickMain(im) ?? pickThumb(im) ?? "") + ":" + i}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white ${
                      active ? "ring-2 ring-black/40" : "hover:bg-black/5"
                    }`}
                    aria-label={tTitle}
                    title={tTitle}
                  >
                    {t ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t} alt={tTitle} title={tTitle} className="h-full w-full object-cover" draggable={false} />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          {/* ✅ H1 + title */}
          <h1 className="text-xl font-semibold leading-tight" title={p.name}>
            {p.name}
          </h1>

          {/* ✅ cena + title */}
          <div className="mt-2 text-lg font-bold" title={pageTitle}>
            {formatRSD(p.price_rsd)}
          </div>

          <div className="mt-4 rounded-2xl border bg-white p-4 text-sm text-black/70" title="Napomena">
            (MVP) Dodajemo opis/specifikacije kad povežemo pravi product endpoint.
          </div>
        </div>
      </div>

      {/* ✅ PORTAL */}
      {hydrated && Lightbox ? createPortal(Lightbox, document.body) : null}
    </div>
  );
}
