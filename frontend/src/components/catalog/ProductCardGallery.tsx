"use client";

import * as React from "react";
import Link from "next/link";
import type { ProductListingItem, ProductImageDTO } from "@/hooks/useCategoryProducts";
import { Badge } from "@/components/ui/Badge";

function formatRSD(n: number) {
  return new Intl.NumberFormat("sr-RS").format(Math.round(n)) + " RSD";
}

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

function pickGrid(im: ProductImageDTO | undefined | null): string | null {
  if (!im) return null;
  return im.grid ?? im.thumb ?? im.original ?? im.pdp ?? null;
}

function pickThumb(im: ProductImageDTO | undefined | null): string | null {
  if (!im) return null;
  return im.thumb ?? im.grid ?? im.original ?? im.pdp ?? null;
}

function getGallery(p: ProductListingItem): Array<{ main: string; thumb: string; alt: string; key: string }> {
  const out: Array<{ main: string; thumb: string; alt: string; key: string }> = [];
  const seen = new Set<string>();

  const images = Array.isArray(p.images) ? p.images : [];
  for (const im of images) {
    const main = pickGrid(im);
    if (!main) continue;
    if (seen.has(main)) continue;
    seen.add(main);

    const thumb = pickThumb(im) ?? main;
    const alt = (im.alt && im.alt.trim()) ? im.alt.trim() : p.name;
    const key = typeof im.id === "number" ? String(im.id) : main;

    out.push({ main, thumb, alt, key });
    if (out.length >= 4) break;
  }

  // fallback for legacy single image
  if (out.length === 0 && p.image_grid_url) {
    const u = String(p.image_grid_url);
    out.push({ main: u, thumb: u, alt: p.name, key: u });
  }

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

  // badges (MVP logic):
  // - B2B badge always present (jer želiš B2C+B2B miks)
  // - Sale badge ako pricing ima old price ili discount hint (best-effort)
  const hasPricing = (p as any).pricing != null;
  const pricing = (p as any).pricing;
  const oldPrice = pricing?.retail?.price_compare_rsd ?? pricing?.retail?.price_old_rsd ?? null;
  const isSale = typeof oldPrice === "number" && oldPrice > p.price_rsd;

  return (
    <div
      className="group rounded-lg border bg-white p-2 transition hover:shadow-sm"
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

          {/* badges overlay */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="bg-white/85">
              B2B
            </Badge>

            {isSale ? (
              <Badge variant="default" className="bg-red-50 text-red-700">
                Akcija
              </Badge>
            ) : null}

            {hasPricing ? (
              <Badge variant="default" className="bg-black/5 text-black/70">
                Cena iz kalk.
              </Badge>
            ) : null}
          </div>

          {/* hover thumb strip */}
          {gallery.length > 1 ? (
            <div
              className={cx(
                "absolute bottom-2 left-2 right-2 hidden items-center gap-1.5 rounded-md border bg-white/90 p-1 shadow-sm sm:flex",
                hover ? "opacity-100" : "opacity-0",
                "transition-opacity"
              )}
              aria-hidden={!hover}
            >
              {gallery.slice(0, 4).map((img, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={img.key}
                    type="button"
                    className={cx(
                      "h-10 w-10 overflow-hidden rounded border bg-black/5",
                      isActive ? "ring-2 ring-black/25" : "hover:border-black/20"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActive(i);
                    }}
                    tabIndex={hover ? 0 : -1}
                    aria-label={`Slika ${i + 1}`}
                    title={`Slika ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumb} alt={img.alt} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </Link>

      {/* info block (MIC-like compact) */}
      <div className="mt-2 flex flex-col gap-1">
        <Link href={href} title={p.name} className="block">
          <div className="line-clamp-2 text-[13px] font-semibold leading-4">{p.name}</div>
        </Link>

        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[13px] font-bold">{formatRSD(p.price_rsd)}</div>
          {isSale && typeof oldPrice === "number" ? (
            <div className="text-[11px] text-black/50 line-through">{formatRSD(oldPrice)}</div>
          ) : null}
        </div>

        {/* CTA row (B2C + B2B) */}
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className="h-8 rounded-md border bg-white text-[12px] font-medium hover:bg-black/5"
            onClick={() => addToCart(p)}
            title="B2C: dodaj u korpu"
          >
            U korpu
          </button>
          <button
            type="button"
            className="h-8 rounded-md bg-black text-[12px] font-medium text-white hover:bg-black/90"
            onClick={() => sendInquiry(p)}
            title="B2B: pošalji upit"
          >
            Upit
          </button>
        </div>
      </div>
    </div>
  );
}
