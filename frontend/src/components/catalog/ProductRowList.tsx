"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductListingItem, ProductImageDTO } from "@/hooks/useCategoryProducts";

function formatRSD(n: number) {
  return new Intl.NumberFormat("sr-RS").format(Math.round(n)) + " RSD";
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
    const url = pickUrl(im);
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= 6) break;
  }

  const fallback = p.image_grid_url ?? p.image_thumb_url ?? null;
  if (out.length === 0 && fallback) out.push(fallback);

  return out;
}

function safeSlugPath(slugPath: string) {
  const s = (slugPath ?? "").trim().replace(/^\/+|\/+$/g, "");
  return s.length ? s : "";
}

function addToCart(p: ProductListingItem) {
  console.log("[cart] add", p.id, p.name);
}

/**
 * NOTE: "Upit" (B2B inquiry) je privremeno uklonjen po zahtevu.
 * Kad krene B2B gating / lead flow, vraćamo handler + dugme.
 */
// function sendInquiry(p: ProductListingItem) {
//   console.log("[inquiry] open", p.id, p.name);
// }

export function ProductRowList({ slugPath, p }: { slugPath: string; p: ProductListingItem }) {
  const basePath = safeSlugPath(slugPath);
  const href = basePath ? `/${basePath}/${p.slug}` : `/${p.slug}`;

  const imgs = React.useMemo(() => getImages(p), [p]);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => setIdx(0), [p.id]);

  const activeSrc = imgs[idx] ?? imgs[0] ?? null;
  const canPrev = idx > 0;
  const canNext = idx < imgs.length - 1;

  const isSale = !!p.is_sale;
  const oldPrice = typeof p.old_price_rsd === "number" ? p.old_price_rsd : null;

  const titleAdd = `Dodaj "${p.name}" u korpu`;
  const titleMore = `Opsirnije o "${p.name}"`;

  return (
    <div className="mic-card-dense mic-card-hover p-2">
      <div className="flex gap-3">
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

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={href} title={p.name} className="min-w-0">
              <div className="line-clamp-2 text-[13px] font-semibold leading-4">{p.name}</div>
            </Link>

            {isSale ? <span className="mic-badge bg-red-50 text-red-700 border-red-100">Akcija</span> : null}

            {/* NOTE: Uklonjeno po zahtevu:
                <span className="mic-badge">B2B</span>
             */}
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-[13px] font-bold">{formatRSD(p.price_rsd)}</div>
            {isSale && typeof oldPrice === "number" ? (
              <div className="text-[11px] text-black/50 line-through">{formatRSD(oldPrice)}</div>
            ) : null}
          </div>

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

        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <div className="text-right">
            <div className="text-[11px] text-black/45">Brza akcija</div>
            <div className="text-[12px] font-semibold">Dostupno</div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              className="mic-btn-primary h-8 w-28"
              onClick={() => addToCart(p)}
              title={titleAdd}
              aria-label={titleAdd}
            >
              Dodaj
            </button>

            <Link href={href} className="mic-btn h-8 w-28 text-center" title={titleMore} aria-label={titleMore}>
              Opsirnije
            </Link>

            {/* NOTE: Uklonjeno po zahtevu:
                <button type="button" className="mic-btn-solid h-8 w-28" onClick={() => sendInquiry(p)}>Upit</button>
             */}
          </div>
        </div>
      </div>
    </div>
  );
}
