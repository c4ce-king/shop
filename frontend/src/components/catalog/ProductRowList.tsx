"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ProductListingItem, ProductImageDTO } from "@/hooks/useCategoryProducts";
import { buildProductTitle } from "@/lib/site";
import { ProductCardActions } from "@/components/catalog/ProductCardActions";
import { extractPrice, formatRSD } from "./price";

/**
 * ✅ DEBUG: stavi na false kad potvrdiš da vidiš pillove.
 * Dok je true, uvek ćeš videti "Akcija", "-25%" i "Na stanju" na slici.
 */
const DEBUG_FORCE_PILLS = true;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pickUrl(im: ProductImageDTO | undefined | null): string | null {
  if (!im) return null;
  return im.grid ?? im.thumb ?? im.original ?? im.pdp ?? null;
}

type GalleryItem = { main: string; thumb: string };

function getGallery(p: ProductListingItem): GalleryItem[] {
  const out: GalleryItem[] = [];
  const seen = new Set<string>();

  const images = Array.isArray((p as any).images) ? ((p as any).images as any[]) : [];
  for (const im of images) {
    const url = pickUrl(im as any);
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ main: url, thumb: url });
    if (out.length >= 6) break;
  }

  const fallback = (p as any).image_grid_url ?? (p as any).image_thumb_url ?? null;
  if (out.length === 0 && fallback) out.push({ main: fallback, thumb: fallback });

  return out;
}

function safeSlugPath(slugPath: string) {
  const s = (slugPath ?? "").trim().replace(/^\/+|\/+$/g, "");
  return s.length ? s : "";
}

function isInStock(p: ProductListingItem): boolean | null {
  const anyP: any = p;
  const b = (v: any) => (typeof v === "boolean" ? v : null);

  const direct =
    b(anyP.in_stock) ??
    b(anyP.is_in_stock) ??
    b(anyP.available) ??
    b(anyP.is_available) ??
    b(anyP.isAvailable);

  if (direct != null) return direct;

  const qty = anyP.stock_qty ?? anyP.qty ?? anyP.quantity ?? anyP.inventory ?? anyP.stock ?? null;
  if (typeof qty === "number") return qty > 0;

  const st: string | null =
    typeof anyP.stock_status === "string"
      ? anyP.stock_status
      : typeof anyP.availability === "string"
        ? anyP.availability
        : null;

  if (st) {
    const s = st.toLowerCase();
    if (s.includes("in_stock") || s.includes("instock") || s.includes("available") || s.includes("na stanju"))
      return true;
    if (s.includes("out_of_stock") || s.includes("unavailable") || s.includes("nema") || s.includes("rasprodato"))
      return false;
  }

  return null;
}

function PriceBlock({ p }: { p: ProductListingItem }) {
  const price = extractPrice(p);

  if (price.current == null) {
    return <div className="text-xs mic-muted">Cena na upit</div>;
  }

  return (
    <div className="flex items-baseline gap-2">
      <div className="text-[15px] font-semibold tracking-tight text-neutral-900 tabular-nums">
        {formatRSD(price.current)}
      </div>

      {price.old != null ? (
        <>
          <div className="text-[12px] mic-muted line-through tabular-nums">{formatRSD(price.old)}</div>
          {price.percentOff != null ? (
            <div className="rounded-full bg-black px-2 py-0.5 text-[11px] font-semibold text-white">
              -{price.percentOff}%
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function ProductRowList({
  slugPath,
  categoryName,
  p,
}: {
  slugPath: string;
  categoryName?: string | null;
  p: ProductListingItem;
}) {
  const basePath = safeSlugPath(slugPath);
  const href = basePath ? `/${basePath}/${(p as any).slug}` : `/${(p as any).slug}`;

  const categoryLabel = (categoryName ?? "Katalog").trim() || "Katalog";
  const seoTitle = buildProductTitle(categoryLabel, p.name);

  const gallery = React.useMemo(() => getGallery(p), [p]);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => setActive(0), [(p as any).id]);

  const activeSrc = gallery[active]?.main ?? gallery[0]?.main ?? (p as any).image_grid_url ?? null;

  const canPrev = active > 0;
  const canNext = active < gallery.length - 1;

  const productId = ((p as any).id ?? (p as any).product_id) as string | number;

  const price = extractPrice(p);
  const realIsSale = !!(p as any).is_sale || price.old != null;
  const realPercent = price.percentOff ?? null;

  const stock = isInStock(p);
  const realShowStock = stock === true;

  // ✅ DEBUG override (da sigurno vidiš promenu)
  const isSale = DEBUG_FORCE_PILLS ? true : realIsSale;
  const percent = DEBUG_FORCE_PILLS ? 25 : realPercent;
  const showStock = DEBUG_FORCE_PILLS ? true : realShowStock;

  return (
    <div className="mic-product-card group mic-card mic-card-hover relative p-3">
      <div className="grid grid-cols-[104px_1fr] gap-3 sm:grid-cols-[132px_1fr] items-stretch">
        {/* Media */}
        <Link href={href} title={seoTitle} className="block">
          <div className="relative aspect-square overflow-hidden rounded-md bg-neutral-50">
            {activeSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSrc}
                  alt={p.name}
                  title={seoTitle}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
                  loading="lazy"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/12 via-black/0 to-black/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                {/* Pills: dno slike, desktop hover only (touch uvek) */}
                {(isSale || showStock) ? (
                  <div className="absolute left-2 bottom-2 flex flex-wrap items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {isSale ? (
                      <div className="rounded-full bg-black px-2 py-1 text-[11px] font-semibold text-white leading-none">
                        Akcija
                      </div>
                    ) : null}

                    {percent != null ? (
                      <div className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-black shadow leading-none">
                        -{percent}%
                      </div>
                    ) : null}

                    {showStock ? (
                      <div className="rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-black shadow leading-none">
                        Na stanju
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs mic-muted">Nema</div>
            )}

            {/* MIC-like image switching: chevrons + dots */}
            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActive((x) => Math.max(0, x - 1));
                  }}
                  className={cx(
                    "absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-1 shadow",
                    "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                    "disabled:opacity-40"
                  )}
                  aria-label="Prethodna slika"
                  title="Prethodna slika"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={!canNext}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActive((x) => Math.min(gallery.length - 1, x + 1));
                  }}
                  className={cx(
                    "absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-1 shadow",
                    "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                    "disabled:opacity-40"
                  )}
                  aria-label="Sledeća slika"
                  title="Sledeća slika"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 px-2 pointer-events-none">
                  {gallery.map((g, i) => (
                    <span
                      key={`${g.thumb}-${i}`}
                      className={cx("h-1.5 w-1.5 rounded-full transition", i === active ? "bg-black" : "bg-black/30")}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </Link>

        {/* Content */}
        <div className="flex min-w-0 flex-col justify-between min-h-[104px] sm:min-h-[132px]">
          <div className="flex min-w-0 flex-col gap-1.5 min-h-0">
            <Link href={href} title={seoTitle} className="block">
              <div className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 hover:underline">
                {p.name}
              </div>
            </Link>

            <PriceBlock p={p} />

            <div className="grid gap-1 text-xs mic-muted">
              <div className="truncate" title="Rok isporuke">
                Isporuka: 1–3 dana
              </div>
              <div className="truncate" title="Povraćaj">
                Povraćaj: 14 dana
              </div>
            </div>
          </div>

          <div className="pt-2 mt-2 flex items-end justify-end border-t" style={{ borderColor: "rgb(var(--border))" }}>
            <ProductCardActions productId={productId} size="sm" variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}