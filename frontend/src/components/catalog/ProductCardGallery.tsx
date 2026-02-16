"use client";

import * as React from "react";
import Link from "next/link";
import type { ProductListingItem } from "@/hooks/useCategoryProducts";

function formatRSD(n: number) {
  return new Intl.NumberFormat("sr-RS").format(Math.round(n)) + " RSD";
}

type Img = { main: string; thumb: string; alt: string; key: string };

function pickMain(x: any): string | null {
  if (!x) return null;
  if (typeof x === "string") return x.trim() || null;
  if (typeof x === "object") {
    const u =
      (typeof x.grid === "string" && x.grid) ||
      (typeof x.thumb === "string" && x.thumb) ||
      (typeof x.original === "string" && x.original) ||
      null;
    return u ? String(u).trim() : null;
  }
  return null;
}

function pickThumb(x: any): string | null {
  if (!x) return null;
  if (typeof x === "string") return x.trim() || null;
  if (typeof x === "object") {
    const u =
      (typeof x.thumb === "string" && x.thumb) ||
      (typeof x.grid === "string" && x.grid) ||
      (typeof x.original === "string" && x.original) ||
      null;
    return u ? String(u).trim() : null;
  }
  return null;
}

function getThumbStrip(p: ProductListingItem): Img[] {
  const out: Img[] = [];
  const seen = new Set<string>();

  const raw = (p as any).images;

  // Prefer new DTO array
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object") {
    for (const it of raw) {
      const main = pickMain(it);
      if (!main) continue;

      const thumb = pickThumb(it) || main;
      const alt = typeof it?.alt === "string" && it.alt.trim() ? it.alt.trim() : p.name;

      const uniqKey = main;
      if (seen.has(uniqKey)) continue;
      seen.add(uniqKey);

      const key = typeof it?.id === "number" ? String(it.id) : uniqKey;

      out.push({ main, thumb, alt, key });
      if (out.length >= 3) break;
    }
  }

  // Old string[] images
  if (out.length === 0 && Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
    for (const u of raw) {
      const main = pickMain(u);
      if (!main) continue;

      if (seen.has(main)) continue;
      seen.add(main);

      out.push({ main, thumb: main, alt: p.name, key: main });
      if (out.length >= 3) break;
    }
  }

  // Ensure at least one image from image_grid_url
  const fallback = p.image_grid_url ? String(p.image_grid_url).trim() : "";
  if (fallback) {
    if (out.length === 0) {
      out.push({ main: fallback, thumb: fallback, alt: p.name, key: fallback });
    } else if (!seen.has(fallback) && out.length < 3) {
      out.push({ main: fallback, thumb: fallback, alt: p.name, key: fallback });
    }
  }

  return out.slice(0, 3);
}

export function ProductCardGallery({ slugPath, p }: { slugPath: string; p: ProductListingItem }) {
  const href = `/${slugPath}/${p.slug}`;

  const strip = React.useMemo(() => getThumbStrip(p), [p]);
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    setActive(0);
  }, [p.id]);

  const primary = strip[0]?.main ?? (p.image_grid_url ? String(p.image_grid_url) : null);
  const activeSrc = strip[active]?.main ?? primary;

  return (
    <div
      className="group rounded-2xl border bg-white p-3 transition hover:shadow-sm"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(0); // reset on mouse leave (clean + predictable)
      }}
    >
      <Link href={href} title={p.name} className="block">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black/5">
          {activeSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeSrc} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
          ) : null}

          {/* Mini thumb strip (desktop hover) */}
          {strip.length > 1 ? (
            <div
              className={[
                "absolute bottom-2 right-2 hidden max-w-[80%] items-center gap-1.5 rounded-xl border bg-white/90 p-1.5 shadow-sm",
                "sm:flex",
                hover ? "opacity-100" : "opacity-0",
                "transition-opacity",
              ].join(" ")}
              aria-hidden={!hover}
            >
              {strip.map((img, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={img.key}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault(); // don't navigate
                      e.stopPropagation();
                      setActive(i);
                    }}
                    className={[
                      "h-10 w-10 overflow-hidden rounded-lg border bg-black/5 transition",
                      isActive ? "ring-2 ring-black/35" : "hover:border-black/20",
                    ].join(" ")}
                    aria-label={`Slika ${i + 1}`}
                    tabIndex={hover ? 0 : -1}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumb} alt={img.alt || p.name} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </Link>

      <Link href={href} title={p.name} className="mt-3 block">
        <div className="flex flex-col gap-1">
          <div className="line-clamp-2 text-sm font-semibold">{p.name}</div>
          <div className="mt-1 text-sm font-bold">{formatRSD(p.price_rsd)}</div>
        </div>
      </Link>
    </div>
  );
}
