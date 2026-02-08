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

export type PriceMeta = { min_available: number | null; max_available: number | null };

export type CategoryListingResponse = {
  category: { id: number; name: string; slug_path: string };
  products: { id: number; name: string; slug: string; price_rsd: number; image_grid_url?: string | null }[];
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

export function useCategoryProducts(slugPath: string, filters: ListingFilters) {
  const f = normalizeFilters(filters);

  return useQuery({
    queryKey: categoryProductsQueryKey(slugPath, f),
    queryFn: ({ signal }) => fetchCategoryProducts(slugPath, f, signal),
    enabled: !!slugPath,
    staleTime: 10_000,
    placeholderData: (prev) => prev, // nema blink
    retry: 0,
  });
}
