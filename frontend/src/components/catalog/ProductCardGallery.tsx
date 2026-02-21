"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ProductListingItem, ProductImageDTO } from "@/hooks/useCategoryProducts";
import { buildProductTitle } from "@/lib/site";
import { ProductCardActions } from "@/components/catalog/ProductCardActions";
import { extractPrice, formatRSD } from "./price";

/**
 * ✅ FORCE (samo za test da se promene vide):
 * Kad potvrdiš da vidiš pillove, prebaci na false.
 */
const FORCE_SHOW_PILLS = true;

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

function PriceStack({ p }: { p: ProductListingItem }) {
  const price = extractPrice(p);

  if (price.current == null) {
    return <div className="text-xs mic-muted">Cena na upit</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="text-[15px] font-semibold tracking-tight text-neutral-900 tabular-nums leading-tight">
        {formatRSD(price.current)}
      </div>

      {price.old != null ? (
        <div className="mt-0.5 text-[12px] mic-muted line-through tabular-nums leading-tight">
          {formatRSD(price.old)}
        </div>
      ) : null}
    </div>
  );
}

export function ProductCardGallery({
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
  const productId = ((p as any).id ?? (p as any).product_id) as string | number;

  const price = extractPrice(p);
  const realPercent = price.percentOff ?? null;
  const realIsSale = !!(p as any).is_sale || price.old != null || realPercent != null;

  // ✅ Force prikaz (da se promene MORAJU videti)
  const saleLabel = FORCE_SHOW_PILLS
    ? "Akcija -25%"
    : realIsSale
      ? realPercent != null
        ? `Akcija -${realPercent}%`
        : "Akcija"
      : null;

  const showStock = FORCE_SHOW_PILLS ? true : false; // za sad samo test

  const canPrev = active > 0;
  const canNext = active < gallery.length - 1;

  return (
    <div className="mic-product-card group mic-card mic-card-hover relative overflow-hidden h-full flex flex-col">
      <Link href={href} title={seoTitle} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-50">
          {activeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeSrc}
              alt={p.name}
              title={seoTitle}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm mic-muted">Nema slike</div>
          )}

          <div className="absolute right-2 top-2 z-10">
            <ProductCardActions productId={productId} size="sm" variant="overlay" />
          </div>

          {/* ✅ Akcija gore levo */}
          {saleLabel ? (
            <div className="absolute left-2 top-2 z-10">
              <div className="rounded-full bg-red-600 px-2 py-1 text-xs font-extrabold text-white shadow leading-none">
                {saleLabel}
              </div>
            </div>
          ) : null}

          {/* ✅ Na stanju dole levo */}
          {showStock ? (
            <div className="absolute left-2 bottom-2 z-10">
              <div className="rounded-full bg-emerald-500 px-2 py-1 text-xs font-semibold text-white shadow leading-none">
                Na stanju
              </div>
            </div>
          ) : null}

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
                  "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-1 shadow",
                  "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
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
                  "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-1 shadow",
                  "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity",
                  "disabled:opacity-40"
                )}
                aria-label="Sledeća slika"
                title="Sledeća slika"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 px-2">
                {gallery.map((g, i) => (
                  <button
                    key={`${g.thumb}-${i}`}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActive(i);
                    }}
                    className={cx(
                      "h-1.5 w-1.5 rounded-full transition",
                      i === active ? "bg-black" : "bg-black/30 hover:bg-black/60"
                    )}
                    aria-label={`Slika ${i + 1}`}
                    title={`Slika ${i + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <Link href={href} title={seoTitle} className="block">
          <div className="min-h-[40px] line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 hover:underline">
            {p.name}
          </div>
        </Link>

        {/* ✅ nova cena + stara ispod precrtana */}
        <PriceStack p={p} />

        <div className="grid gap-1 text-xs mic-muted">
          <div className="min-h-[16px]" title="Rok isporuke">
            Isporuka: 1–3 dana
          </div>
        </div>

        <div className="mt-auto" />
      </div>
    </div>
  );
}