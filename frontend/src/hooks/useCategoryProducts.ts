"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { ListingFilters } from "@/hooks/useUrlFilters";
import { normalizeFilters } from "@/hooks/useUrlFilters";

export type FacetOption = { value: string; label: string; count: number };

export type Facet = {
  code: string;
  label: string;
  type: "multi" | "single";
  options: FacetOption[];
};

export type PriceMeta = {
  min_available: number | null;
  max_available: number | null;
  mode?: string;
};

export type ProductImageDTO = {
  id: number | null;
  alt: string;
  sort_order: number;
  original: string | null;
  thumb: string | null;
  grid: string | null;
  pdp: string | null;
};

export type ProductListingItem = {
  id: number;
  name: string;
  slug: string;
  price_rsd: number;

  image_grid_url?: string | null;
  images?: ProductImageDTO[]; // normalized
};

export type CategoryListingResponse = {
  category: { id: number; name: string; slug_path: string };
  products: ProductListingItem[];
  facets: Facet[];
  meta?: { price?: PriceMeta };
  pagination: { page: number; per_page: number; total: number };
};

// ✅ Stabilizuj redosled multi vrednosti -> stabilan URL i stabilan cache key
function stableArray(xs: unknown): string[] {
  const arr = Array.isArray(xs) ? xs : [];
  return arr
    .map((x) => String(x))
    .filter((s) => s.trim() !== "")
    .sort((a, b) => a.localeCompare(b));
}

function stableFilters(filters: ListingFilters): ListingFilters {
  const f = normalizeFilters(filters);

  return {
    ...f,
    brand: stableArray((f as any).brand),
    size: stableArray((f as any).size),
    color: stableArray((f as any).color),
    material: stableArray((f as any).material),
  } as ListingFilters;
}

function toBackendParams(filters: ListingFilters): URLSearchParams {
  const f = stableFilters(filters);
  const sp = new URLSearchParams();

  for (const v of (f as any).brand ?? []) sp.append("brand", v);
  for (const v of (f as any).size ?? []) sp.append("size", v);
  for (const v of (f as any).color ?? []) sp.append("color", v);
  for (const v of (f as any).material ?? []) sp.append("material", v);

  if ((f as any).min != null) sp.set("min", String(Math.round((f as any).min)));
  if ((f as any).max != null) sp.set("max", String(Math.round((f as any).max)));

  if ((f as any).sort && (f as any).sort !== "podrazumevano") sp.set("sort", (f as any).sort);
  if ((f as any).page && (f as any).page > 1) sp.set("page", String((f as any).page));
  if ((f as any).perPage && (f as any).perPage !== 24) sp.set("per_page", String((f as any).perPage));

  return sp;
}

export function categoryProductsUrl(slugPath: string, filters: ListingFilters) {
  const sp = toBackendParams(filters);
  const qs = sp.toString();
  return qs ? `/api/category/${slugPath}/products?${qs}` : `/api/category/${slugPath}/products`;
}

export function categoryProductsQueryKey(slugPath: string, filters: ListingFilters) {
  // ✅ key baziran na stabilnom URL-u
  const url = categoryProductsUrl(slugPath, filters);
  return ["catProducts", slugPath, url] as const;
}

export function fetchCategoryProducts(slugPath: string, filters: ListingFilters, signal?: AbortSignal) {
  const url = categoryProductsUrl(slugPath, filters);
  return apiGet<CategoryListingResponse>(url, undefined, signal);
}

function normalizeFacetCode(code: string): string {
  const c = (code ?? "").toLowerCase();
  if (c === "brend") return "brand";
  if (c === "velicina") return "size";
  if (c === "boja") return "color";
  if (c === "materijal") return "material";
  return code;
}

function normalizeResponseFacets(res: CategoryListingResponse): CategoryListingResponse {
  const facets = Array.isArray(res.facets) ? res.facets : [];
  const normalized = facets.map((f) => ({
    ...f,
    code: normalizeFacetCode(f.code),
  }));

  const by = new Map<string, Facet>();
  for (const f of normalized) {
    const key = f.code;
    const prev = by.get(key);
    if (!prev) {
      by.set(key, f);
      continue;
    }

    const optMap = new Map<string, FacetOption>();
    for (const o of prev.options ?? []) optMap.set(String(o.value), o);
    for (const o of f.options ?? []) optMap.set(String(o.value), o);

    by.set(key, { ...prev, options: Array.from(optMap.values()) });
  }

  return { ...res, facets: Array.from(by.values()) };
}

function normalizeProductImages(res: CategoryListingResponse): CategoryListingResponse {
  const products = Array.isArray(res.products) ? res.products : [];

  const normalizedProducts = products.map((p) => {
    const raw = (p as any).images;
    let images: ProductImageDTO[] | undefined;

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

    if (!images && Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
      const urls = raw.filter((u: any) => typeof u === "string" && u.trim() !== "") as string[];
      images = urls.slice(0, 5).map((u, idx) => ({
        id: null,
        alt: "",
        sort_order: idx,
        original: u,
        thumb: u,
        grid: u,
        pdp: u,
      }));
    }

    if ((!images || images.length === 0) && p.image_grid_url) {
      const u = p.image_grid_url;
      images = [
        {
          id: null,
          alt: "",
          sort_order: 0,
          original: u,
          thumb: u,
          grid: u,
          pdp: u,
        },
      ];
    }

    let image_grid_url = p.image_grid_url ?? null;
    if (!image_grid_url && images && images.length > 0) {
      image_grid_url = images[0].grid ?? images[0].thumb ?? images[0].original ?? null;
    }

    return { ...p, image_grid_url, images } as ProductListingItem;
  });

  return { ...res, products: normalizedProducts };
}

function normalizeResponse(res: CategoryListingResponse): CategoryListingResponse {
  return normalizeProductImages(normalizeResponseFacets(res));
}

export function useCategoryProducts(slugPath: string, filters: ListingFilters) {
  const f = stableFilters(filters);

  return useQuery({
    queryKey: categoryProductsQueryKey(slugPath, f),
    queryFn: ({ signal }) => fetchCategoryProducts(slugPath, f, signal),
    enabled: !!slugPath,

    select: normalizeResponse,

    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 0,

    // ✅ NAJBITNIJE: nema "blink" na promenu filtera
    placeholderData: (prev) => prev,
  });
}
