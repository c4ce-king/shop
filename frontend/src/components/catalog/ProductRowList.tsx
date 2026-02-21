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
  // TODO: wire to real cart
  console.log("[cart] add", p.id, p.name);
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
  const href = basePath ? `/${basePath}/${p.slug}` : `/${p.slug}`;

  const categoryLabel = (categoryName ?? "Katalog").trim() || "Katalog";
  const seoTitle = buildProductTitle(categoryLabel, p.name);

  const imgs = React.useMemo(() => getImages(p), [p]);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => setIdx(0), [p.id]);

  const activeSrc = imgs[idx] ?? imgs[0] ?? null;
  const canPrev = idx > 0;
  const canNext = idx < imgs.length - 1;

  const isSale = !!p.is_sale;
  const cartTitle = p.name ? `Dodaj u korpu: ${p.name}` : "Dodaj u korpu";

  return (
    <div className="mic-product-card group mic-card mic-card-hover relative p-3">
      <div className="grid grid-cols-[104px_1fr] gap-3 sm:grid-cols-[132px_1fr]">
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

                {/* subtle hover overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/12 via-black/0 to-black/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                {isSale ? (
                  <div className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[11px] font-semibold text-white">
                    Akcija
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs mic-muted">
                Nema
              </div>
            )}

            {imgs.length > 1 ? (
              <>
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIdx((x) => Math.max(0, x - 1));
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
                    setIdx((x) => Math.min(imgs.length - 1, x + 1));
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
              </>
            ) : null}
          </div>
        </Link>

        {/* Content */}
        <div className="flex min-w-0 flex-col gap-2">
          <Link href={href} title={seoTitle} className="block">
            <div className="min-h-[40px] line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 hover:underline">
              {p.name}
            </div>
          </Link>

          {/* NOTE: Uklonjeno po zahtevu (B2B/cena na listing karticama).
              Vraćamo kasnije uz B2B gating / pricing prikaz.
          */}

          <div className="grid gap-1 text-xs mic-muted">
            <div title="Rok isporuke">Isporuka: 2–5 dana</div>
            <div title="Minimalna količina">MOQ: Kontakt</div>
          </div>

          {/* CTA: kompaktan + dno kolone */}
          <div className="mt-auto flex items-center justify-end">
            <button
              type="button"
              onClick={() => addToCart(p)}
              className="mic-btn-primary"
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
      </div>
    </div>
  );
}