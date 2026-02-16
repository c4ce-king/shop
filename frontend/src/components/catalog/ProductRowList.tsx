"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductListingItem, ProductImageDTO } from "@/hooks/useCategoryProducts";
import { Badge } from "@/components/ui/Badge";

function formatRSD(n: number) {
  return new Intl.NumberFormat("sr-RS").format(Math.round(n)) + " RSD";
}

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

function pickUrl(im: ProductImageDTO | undefined | null): string | null {
  if (!im) return null;
  return im.grid ?? im.thumb ?? im.original ?? im.pdp ?? null;
}

function getImages(p: ProductListingItem): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const images = Array.isArray(p.images) ? p.images : [];
  for (const im of images) {
    const u = pickUrl(im);
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= 6) break;
  }

  if (out.length === 0 && p.image_grid_url) out.push(String(p.image_grid_url));
  return out;
}

function safeSlugPath(slugPath: string) {
  const s = (slugPath ?? "").trim();
  return s ? s : "";
}

// Placeholder actions (B2C + B2B)
function addToCart(p: ProductListingItem) {
  console.log("[cart] add", p.id, p.name);
}

function sendInquiry(p: ProductListingItem) {
  console.log("[inquiry] open", p.id, p.name);
}

export function ProductRowList({ slugPath, p }: { slugPath: string; p: ProductListingItem }) {
  const basePath = safeSlugPath(slugPath);
  const href = basePath ? `/${basePath}/${p.slug}` : `/${p.slug}`;

  const imgs = React.useMemo(() => getImages(p), [p]);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    setIdx(0);
  }, [p.id]);

  const canPrev = idx > 0;
  const canNext = idx < imgs.length - 1;

  const activeSrc = imgs[idx] ?? null;

  // sale badge (best-effort)
  const pricing = (p as any).pricing;
  const oldPrice = pricing?.retail?.price_compare_rsd ?? pricing?.retail?.price_old_rsd ?? null;
  const isSale = typeof oldPrice === "number" && oldPrice > p.price_rsd;

  return (
    <div className="rounded-lg border bg-white p-2 transition hover:shadow-sm">
      <div className="flex gap-3">
        {/* image */}
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md bg-black/5">
          {activeSrc ? (
            <Link href={href} title={p.name} className="block h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeSrc} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
            </Link>
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-black/50">Nema</div>
          )}

          {imgs.length > 1 ? (
            <>
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => setIdx((x) => Math.max(0, x - 1))}
                className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow disabled:opacity-50"
                aria-label="Prethodna slika"
                title="Prethodna"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={!canNext}
                onClick={() => setIdx((x) => Math.min(imgs.length - 1, x + 1))}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow disabled:opacity-50"
                aria-label="Sledeća slika"
                title="Sledeća"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>

        {/* main info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={href} title={p.name} className="min-w-0">
              <div className="line-clamp-2 text-[13px] font-semibold leading-4">{p.name}</div>
            </Link>

            <Badge variant="outline">B2B</Badge>
            {isSale ? <Badge className="bg-red-50 text-red-700">Akcija</Badge> : null}
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-[13px] font-bold">{formatRSD(p.price_rsd)}</div>
            {isSale && typeof oldPrice === "number" ? (
              <div className="text-[11px] text-black/50 line-through">{formatRSD(oldPrice)}</div>
            ) : null}
          </div>

          {/* MIC-like "specs" placeholder (dok ne uvedemo realna polja) */}
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-black/70 md:grid-cols-3">
            <div className="truncate">
              <span className="text-black/45">Stanje:</span> Novo
            </div>
            <div className="truncate">
              <span className="text-black/45">Isporuka:</span> 2–5 dana
            </div>
            <div className="truncate">
              <span className="text-black/45">MOQ:</span> Kontakt
            </div>
          </div>
        </div>

        {/* right actions (B2C + B2B) */}
        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <div className="text-right">
            <div className="text-[11px] text-black/45">Brza akcija</div>
            <div className="text-[12px] font-semibold">Dostupno</div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              className="h-8 w-28 rounded-md border bg-white text-[12px] font-medium hover:bg-black/5"
              onClick={() => addToCart(p)}
              title="B2C: dodaj u korpu"
            >
              U korpu
            </button>
            <button
              type="button"
              className="h-8 w-28 rounded-md bg-black text-[12px] font-medium text-white hover:bg-black/90"
              onClick={() => sendInquiry(p)}
              title="B2B: pošalji upit"
            >
              Upit
            </button>
          </div>
        </div>
      </div>

      {/* thumb strip (row) */}
      {imgs.length > 1 ? (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {imgs.slice(0, 6).map((u, i) => {
            const active = i === idx;
            return (
              <button
                key={`${u}:${i}`}
                type="button"
                className={cx(
                  "h-10 w-10 shrink-0 overflow-hidden rounded border bg-black/5",
                  active ? "ring-2 ring-black/25" : "hover:border-black/20"
                )}
                onClick={() => setIdx(i)}
                aria-label={`Izaberi sliku ${i + 1}`}
                title={`Slika ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
