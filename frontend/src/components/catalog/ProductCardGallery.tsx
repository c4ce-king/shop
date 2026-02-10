"use client";

import * as React from "react";
import Link from "next/link";
import type { ProductListingItem } from "@/hooks/useCategoryProducts";

function formatRSD(n: number) {
  return new Intl.NumberFormat("sr-RS").format(Math.round(n)) + " RSD";
}

export function ProductCardGallery({ slugPath, p }: { slugPath: string; p: ProductListingItem }) {
  const href = `/${slugPath}/${p.slug}`;

  return (
    <Link href={href} className="group block rounded-2xl border bg-white p-3 hover:shadow-sm transition">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-black/5">
        {p.image_grid_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_grid_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <div className="text-sm font-semibold line-clamp-2">{p.name}</div>
        <div className="mt-1 text-sm font-bold">{formatRSD(p.price_rsd)}</div>
      </div>
    </Link>
  );
}
