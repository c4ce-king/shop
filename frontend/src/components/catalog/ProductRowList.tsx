"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductListingItem } from "@/hooks/useCategoryProducts";

function formatRSD(n: number) {
  return new Intl.NumberFormat("sr-RS").format(Math.round(n)) + " RSD";
}

function getImages(p: ProductListingItem): string[] {
  const arr = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const first = p.image_grid_url ? [p.image_grid_url] : [];
  const merged = [...arr, ...first];

  // uniq, max 5
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of merged) {
    const x = String(u || "").trim();
    if (!x || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
    if (out.length >= 5) break;
  }
  return out;
}

export function ProductRowList({ slugPath, p }: { slugPath: string; p: ProductListingItem }) {
  const href = `/${slugPath}/${p.slug}`;
  const imgs = getImages(p);

  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    setIdx(0);
  }, [p.id]);

  const canPrev = idx > 0;
  const canNext = idx < imgs.length - 1;

  return (
    <div className="rounded-2xl border bg-white p-3 hover:shadow-sm transition">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr]">
        <div className="relative">
          <div className="aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-xl bg-black/5">
            {imgs[idx] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgs[idx]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
            ) : null}
          </div>

          {imgs.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/90 p-1.5 shadow-sm hover:bg-white disabled:opacity-40"
                onClick={() => setIdx((x) => Math.max(0, x - 1))}
                disabled={!canPrev}
                aria-label="Prethodna slika"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/90 p-1.5 shadow-sm hover:bg-white disabled:opacity-40"
                onClick={() => setIdx((x) => Math.min(imgs.length - 1, x + 1))}
                disabled={!canNext}
                aria-label="Sledeća slika"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}

          {imgs.length > 1 ? (
            <div className="mt-2 flex items-center gap-1">
              {imgs.map((u, i) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`h-2 w-2 rounded-full ${i === idx ? "bg-black/60" : "bg-black/15 hover:bg-black/30"}`}
                  aria-label={`Slika ${i + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-2">
          <div className="min-w-0">
            <Link href={href} className="text-sm font-semibold hover:underline line-clamp-2">
              {p.name}
            </Link>
            <div className="mt-2 text-sm font-bold">{formatRSD(p.price_rsd)}</div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={href} className="h-9 inline-flex items-center rounded-full border bg-white px-4 text-sm hover:bg-black/5">
              Pogledaj
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
