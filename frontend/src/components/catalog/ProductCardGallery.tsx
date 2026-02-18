"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductListingItem, ProductImageDTO } from "@/hooks/useCategoryProducts";

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

type GalleryItem = { main: string; thumb: string };

function getGallery(p: ProductListingItem): GalleryItem[] {
  const out: GalleryItem[] = [];
  const seen = new Set<string>();

  const images = Array.isArray(p.images) ? p.images : [];
  for (const im of images) {
    const url = pickUrl(im);
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ main: url, thumb: url });
    if (out.length >= 6) break;
  }

  const fallback = p.image_grid_url ?? p.image_thumb_url ?? null;
  if (out.length === 0 && fallback) out.push({ main: fallback, thumb: fallback });

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

export function ProductCardGallery({ slugPath, p }: { slugPath: string; p: ProductListingItem }) {
  const basePath = safeSlugPath(slugPath);
  const href = basePath ? `/${basePath}/${p.slug}` : `/${p.slug}`;

  const gallery = React.useMemo(() => getGallery(p), [p]);
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    setActive(0);
    setHover(false);
  }, [p.id]);

  const activeSrc = gallery[active]?.main ?? gallery[0]?.main ?? p.image_grid_url ?? null;

  const isSale = !!p.is_sale;
  const hasPricing = typeof p.price_rsd === "number" && p.price_rsd > 0;
  const oldPrice = typeof p.old_price_rsd === "number" ? p.old_price_rsd : null;

  const canPrev = active > 0;
  const canNext = active < gallery.length - 1;

  const titleAdd = `Dodaj "${p.name}" u korpu`;
  const titleMore = `Opsirnije o "${p.name}"`;

  return (
    <div
      className="group mic-card-dense mic-card-hover p-2"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(0);
      }}
    >
      <Link href={href} title={p.name} className="block">
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-black/5">
          {activeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeSrc}
              alt={p.name}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-black/50">Nema slike</div>
          )}

          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {isSale ? <span className="mic-badge bg-red-50 text-red-700 border-red-100">Akcija</span> : null}

            {/* NOTE: Uklonjeno po zahtevu (previše šuma). Vraćamo kasnije uz B2B gating:
                <span className="mic-badge">B2B</span>
                {hasPricing ? <span className="mic-badge">Cena</span> : <span className="mic-badge">Na upit</span>}
             */}
          </div>

          {hover && gallery.length > 1 ? (
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
                  "absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow",
                  "disabled:opacity-50"
                )}
                aria-label="Prethodna slika"
                title="Prethodna"
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
                  "absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow",
                  "disabled:opacity-50"
                )}
                aria-label="Sledeća slika"
                title="Sledeća"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}

          {gallery.length > 1 ? (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/80 px-2 py-1 backdrop-blur">
              {gallery.map((g, i) => (
                <button
                  key={g.thumb + i}
                  type="button"
                  aria-label={`Slika ${i + 1}`}
                  title={`Slika ${i + 1}`}
                  className={cx("h-1 w-1 rounded-full", i === active ? "bg-black" : "bg-black/25 hover:bg-black/40")}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActive(i);
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="mt-2">
        <Link href={href} title={p.name} className="block">
          <div className="line-clamp-2 text-[13px] font-semibold leading-4">{p.name}</div>
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          {hasPricing ? (
            <div className="text-[13px] font-bold">{formatRSD(p.price_rsd)}</div>
          ) : (
            <div className="text-[12px] font-semibold">Na upit</div>
          )}

          {isSale && typeof oldPrice === "number" ? (
            <div className="text-[11px] text-black/50 line-through">{formatRSD(oldPrice)}</div>
          ) : null}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            className="mic-btn-primary h-8 flex-1"
            onClick={() => addToCart(p)}
            title={titleAdd}
            aria-label={titleAdd}
          >
            Dodaj
          </button>

          <Link href={href} className="mic-btn h-8 flex-1" title={titleMore} aria-label={titleMore}>
            Opsirnije
          </Link>

          {/* NOTE: Uklonjeno po zahtevu:
              <button type="button" className="mic-btn-solid h-8 flex-1" onClick={() => sendInquiry(p)}>Upit</button>
           */}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-black/70">
          <div className="truncate">
            <span className="text-black/45">Stanje:</span> Novo
          </div>
          <div className="truncate">
            <span className="text-black/45">Isporuka:</span> 2–5 dana
          </div>
        </div>
      </div>
    </div>
  );
}
