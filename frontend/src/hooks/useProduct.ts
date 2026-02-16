"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { ProductImageDTO } from "@/hooks/useCategoryProducts";

export type ProductDTO = {
  id: number;
  name: string;
  slug: string;
  price_rsd: number;
  images?: ProductImageDTO[];
};

export type ProductResponse = ProductDTO | { product: ProductDTO };

function normalizeProductResponse(res: any): ProductDTO {
  const p: any = res?.product ? res.product : res;

  const id = typeof p?.id === "number" ? p.id : 0;
  const name = typeof p?.name === "string" ? p.name : "";
  const slug = typeof p?.slug === "string" ? p.slug : "";
  const price_rsd = typeof p?.price_rsd === "number" ? p.price_rsd : Number(p?.price_rsd ?? 0) || 0;

  const raw = p?.images;
  let images: ProductImageDTO[] = [];

  // images as objects
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null) {
    images = raw.map((x: any, idx: number): ProductImageDTO => {
      const original = typeof x?.original === "string" ? x.original : null;
      const thumb = typeof x?.thumb === "string" ? x.thumb : null;
      const grid = typeof x?.grid === "string" ? x.grid : null;
      const pdp = typeof x?.pdp === "string" ? x.pdp : null;

      return {
        id: typeof x?.id === "number" ? x.id : null,
        alt: typeof x?.alt === "string" ? x.alt : "",
        sort_order: typeof x?.sort_order === "number" ? x.sort_order : idx,
        original,
        thumb,
        grid,
        pdp,
      };
    });

    images.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  // images as strings (legacy)
  if (images.length === 0 && Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
    const urls = raw.filter((u: any) => typeof u === "string" && u.trim() !== "") as string[];
    images = urls.slice(0, 10).map((u, idx) => ({
      id: null,
      alt: "",
      sort_order: idx,
      original: u,
      thumb: u,
      grid: u,
      pdp: u,
    }));
  }

  return { id, name, slug, price_rsd, images };
}

export function productUrl(slug: string) {
  // Backend ruta: /api/product/{slug}
  return `/api/product/${encodeURIComponent(slug)}`;
}

export function productQueryKey(slug: string) {
  return ["product", slug] as const;
}

export function fetchProduct(slug: string, signal?: AbortSignal) {
  return apiGet<ProductResponse>(productUrl(slug), undefined, signal);
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productQueryKey(slug),
    queryFn: ({ signal }) => fetchProduct(slug, signal),
    enabled: !!slug,
    select: (res) => normalizeProductResponse(res),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}
