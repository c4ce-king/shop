"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";

import type { ProductListingItem, ProductImageDTO } from "@/hooks/useCategoryProducts";
import { buildProductTitle } from "@/lib/site";

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
  // TODO: wire to real cart
  console.log("[cart] add", p.id, p.name);
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
  const href = basePath ? `/${basePath}/${p.slug}` : `/${p.slug}`;

  const categoryLabel = (categoryName ?? "Katalog").trim() || "Katalog";
  const seoTitle = buildProductTitle(categoryLabel, p.name);

  const gallery = React.useMemo(() => getGallery(p), [p]);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => setActive(0), [p.id]);

  const activeSrc = gallery[active]?.main ?? gallery[0]?.main ?? p.image_grid_url ?? null;

  const isSale = !!p.is_sale;
  const canPrev = active > 0;
  const canNext = active < gallery.length - 1;

  const cartTitle = p.name ? `Dodaj u korpu: ${p.name}` : "Dodaj u korpu";

  return (
    // ✅ h-full + flex-col => grid može da izjednači visine
    <div className="mic-product-card group mic-card mic-card-hover relative overflow-hidden h-full flex flex-col">
      {/* Media (fiksna visina preko aspect ratio) */}
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
            <div className="flex h-full w-full items-center justify-center text-sm mic-muted">
              Nema slike
            </div>
          )}

          {isSale ? (
            <div className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-xs font-semibold text-white">
              Akcija
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

      {/* ✅ Content: flex-1 + mt-auto na CTA => dugme uvek na dnu */}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <Link href={href} title={seoTitle} className="block">
          {/* ✅ rezerviši visinu naslova (2 linije) da kartice ne “plešu” */}
          <div className="min-h-[40px] line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 hover:underline">
            {p.name}
          </div>
        </Link>

        {/* NOTE: Uklonjeno po zahtevu (B2B/cena na karticama).
            Vraćamo kasnije uz B2B gating / pricing prikaz.
        */}

        {/* ✅ i ovaj blok ima stabilan footprint */}
        <div className="grid gap-1 text-xs mic-muted">
          <div className="min-h-[16px]" title="Rok isporuke">
            Isporuka: 2–5 dana
          </div>
        </div>

        {/* ✅ CTA uvek na dnu kartice */}
        <button
          type="button"
          onClick={() => addToCart(p)}
          className="mic-btn-primary w-full mt-auto"
          aria-label="Dodaj u korpu"
          title={cartTitle}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Dodaj u korpu
          </span>
        </button>
      </div>
    </div>
  );
}