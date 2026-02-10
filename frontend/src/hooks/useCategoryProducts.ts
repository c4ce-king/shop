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

export type PriceMeta = { min_available: number | null; max_available: number | null; mode?: string };

export type ProductListingItem = {
  id: number;
  name: string;
  slug: string;
  price_rsd: number;
  image_grid_url?: string | null;

  // future-proof (kad backend krene da šalje do 5 slika)
  images?: string[]; // urls
};

export type CategoryListingResponse = {
  category: { id: number; name: string; slug_path: string };
  products: ProductListingItem[];
  facets: Facet[];
  meta?: { price?: PriceMeta };
  pagination: { page: number; per_page: number; total: number };
};

function toBackendParams(filters: ListingFilters): URLSearchParams {
  const f = normalizeFilters(filters);
  const sp = new URLSearchParams();

  for (const v of f.brand ?? []) sp.append("brand", v);
  for (const v of f.size ?? []) sp.append("size", v);
  for (const v of f.color ?? []) sp.append("color", v);
  for (const v of f.material ?? []) sp.append("material", v);

  if (f.min != null) sp.set("min", String(Math.round(f.min)));
  if (f.max != null) sp.set("max", String(Math.round(f.max)));

  if (f.sort && f.sort !== "podrazumevano") sp.set("sort", f.sort);
  if (f.page && f.page > 1) sp.set("page", String(f.page));

  if (f.perPage && f.perPage !== 24) sp.set("per_page", String(f.perPage));

  return sp;
}

export function categoryProductsUrl(slugPath: string, filters: ListingFilters) {
  const sp = toBackendParams(filters);
  const qs = sp.toString();
  return qs ? `/api/category/${slugPath}/products?${qs}` : `/api/category/${slugPath}/products`;
}

export function categoryProductsQueryKey(slugPath: string, filters: ListingFilters) {
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

export function useCategoryProducts(slugPath: string, filters: ListingFilters) {
  const f = normalizeFilters(filters);

  return useQuery({
    queryKey: categoryProductsQueryKey(slugPath, f),
    queryFn: ({ signal }) => fetchCategoryProducts(slugPath, f, signal),
    enabled: !!slugPath,

    select: normalizeResponseFacets,

    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,

    retry: 0,
  });
}
