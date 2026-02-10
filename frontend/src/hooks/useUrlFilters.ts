"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export type SortKey =
  | "podrazumevano"
  | "najnovije"
  | "cena_gore"
  | "cena_dole"
  | "popularno"
  | "snizenje"
  | "ocena";

export type ViewMode = "galerija" | "lista";

export type ListingFilters = {
  brand?: string[];
  size?: string[];
  color?: string[];
  material?: string[];
  min?: number | null;
  max?: number | null;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  view?: ViewMode;
};

/**
 * SR query keys (canonical):
 * brend, velicina, boja, materijal, cena_min, cena_max, sort, strana, po_strani, prikaz
 */
const SR_KEYS = {
  brand: "brend",
  size: "velicina",
  color: "boja",
  material: "materijal",
  min: "cena_min",
  max: "cena_max",
  sort: "sort",
  page: "strana",
  perPage: "po_strani",
  view: "prikaz",
} as const;

/**
 * Backward compat EN keys
 */
const EN_KEYS = {
  brand: "brand",
  size: "size",
  color: "color",
  material: "material",
  min: "min",
  max: "max",
  sort: "sort",
  page: "page",
  perPage: "per_page",
  view: "view",
} as const;

/**
 * VALUE TRANSLATION: backend code <-> sr latin url slug
 */
const VALUE_TO_SR: Record<"color" | "material", Record<string, string>> = {
  color: {
    red: "crvena",
    black: "crna",
    white: "bela",
    pink: "roze",
    blue: "plava",
    green: "zelena",
    purple: "ljubicasta",
    yellow: "zuta",
    gray: "siva",
    orange: "narandzasta",
    brown: "braon",
  },
  material: {
    latex: "lateks",
    silicone: "silikon",
    metal: "metal",
    glass: "staklo",
    leather: "koza",
    pvc: "pvc",
  },
};

const SR_TO_VALUE: Record<"color" | "material", Record<string, string>> = {
  color: Object.fromEntries(Object.entries(VALUE_TO_SR.color).map(([k, v]) => [v, k])),
  material: Object.fromEntries(Object.entries(VALUE_TO_SR.material).map(([k, v]) => [v, k])),
};

function encodeValue(key: "brand" | "size" | "color" | "material", v: string) {
  if (key === "color" || key === "material") return VALUE_TO_SR[key][v] ?? v;
  return v;
}

function decodeValue(key: "brand" | "size" | "color" | "material", v: string) {
  if (key === "color" || key === "material") return SR_TO_VALUE[key][v] ?? v;
  return v;
}

const MULTI: Array<keyof Pick<ListingFilters, "brand" | "size" | "color" | "material">> = [
  "brand",
  "size",
  "color",
  "material",
];

function uniq(arr: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of arr) {
    const x = (raw ?? "").trim();
    if (!x) continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function toNumber(v: string | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeSort(v: string | null | undefined): SortKey {
  const allowed: SortKey[] = [
    "podrazumevano",
    "najnovije",
    "cena_gore",
    "cena_dole",
    "popularno",
    "snizenje",
    "ocena",
  ];
  if (!v) return "podrazumevano";
  return allowed.includes(v as SortKey) ? (v as SortKey) : "podrazumevano";
}

function normalizeView(v: string | null | undefined): ViewMode {
  const x = (v ?? "").toLowerCase().trim();

  // canonical SR
  if (x === "galerija") return "galerija";
  if (x === "lista") return "lista";

  // EN / MIC compat
  if (x === "gallery") return "galerija";
  if (x === "list") return "lista";

  // some people use this
  if (x === "grid") return "galerija";

  return "galerija"; // default MIC
}

function normalizePerPage(v: number | null | undefined): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 24;
  // dozvoli 12/24/36/48/60 (MIC-ish)
  const clamped = Math.max(1, Math.min(60, Math.floor(n)));
  const allowed = new Set([12, 24, 36, 48, 60]);
  if (allowed.has(clamped)) return clamped;
  // fallback to nearest
  const arr = [12, 24, 36, 48, 60];
  let best = 24;
  let bestDist = Infinity;
  for (const a of arr) {
    const d = Math.abs(a - clamped);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}

export function normalizeFilters(filters: ListingFilters): ListingFilters {
  const out: ListingFilters = { ...filters };

  for (const k of MULTI) {
    const arr = Array.isArray(out[k]) ? uniq(out[k] as string[]) : [];
    if (arr.length) out[k] = arr as any;
    else delete out[k];
  }

  out.min = out.min == null ? null : Number.isFinite(Number(out.min)) ? Number(out.min) : null;
  out.max = out.max == null ? null : Number.isFinite(Number(out.max)) ? Number(out.max) : null;

  out.sort = normalizeSort(out.sort);

  const page = out.page == null ? 1 : Math.max(1, Math.floor(Number(out.page)));
  out.page = page;

  out.perPage = normalizePerPage(out.perPage);

  out.view = normalizeView(out.view);

  return out;
}

/**
 * URL params (SR keys + SR values)
 */
export function filtersToSearchParams(filters: ListingFilters): URLSearchParams {
  const f = normalizeFilters(filters);
  const sp = new URLSearchParams();

  for (const key of MULTI) {
    const arr = (f[key] as string[] | undefined) ?? [];
    for (const v of arr) sp.append(SR_KEYS[key], encodeValue(key, v));
  }

  if (f.min != null) sp.set(SR_KEYS.min, String(Math.round(f.min)));
  if (f.max != null) sp.set(SR_KEYS.max, String(Math.round(f.max)));

  if (f.sort && f.sort !== "podrazumevano") sp.set(SR_KEYS.sort, f.sort);
  if (f.page && f.page > 1) sp.set(SR_KEYS.page, String(f.page));

  // per-page only if != default
  if (f.perPage && f.perPage !== 24) sp.set(SR_KEYS.perPage, String(f.perPage));

  // view only if != default
  if (f.view && f.view !== "galerija") sp.set(SR_KEYS.view, f.view);

  return sp;
}

/**
 * Parse URL (SR first, fallback EN), decode SR values -> backend codes
 */
function parseFromSearchParams(sp: ReturnType<typeof useSearchParams>): ListingFilters {
  const getAll = (key: keyof typeof SR_KEYS) => {
    const sr = sp.getAll((SR_KEYS as any)[key]).filter(Boolean);
    if (sr.length) return sr;
    return sp.getAll((EN_KEYS as any)[key]).filter(Boolean);
  };

  const getOne = (key: keyof typeof SR_KEYS) => {
    const sr = sp.get((SR_KEYS as any)[key]);
    if (sr != null) return sr;
    return sp.get((EN_KEYS as any)[key]);
  };

  const brand = getAll("brand").map((v) => decodeValue("brand", v));
  const size = getAll("size").map((v) => decodeValue("size", v));
  const color = getAll("color").map((v) => decodeValue("color", v));
  const material = getAll("material").map((v) => decodeValue("material", v));

  // view: check SR prikaz then EN view
  const viewRaw = getOne("view");
  const view = normalizeView(viewRaw);

  // per-page: SR po_strani then EN per_page
  const perPageRaw = getOne("perPage");
  const perPage = normalizePerPage(toNumber(perPageRaw));

  return normalizeFilters({
    brand,
    size,
    color,
    material,
    min: toNumber(getOne("min")),
    max: toNumber(getOne("max")),
    sort: normalizeSort(getOne("sort")),
    page: toNumber(getOne("page")) ?? 1,
    perPage,
    view,
  });
}

type PushMode = "commit" | "draft";

export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qc = useQueryClient();

  const filters = useMemo(() => parseFromSearchParams(sp), [sp]);

  const slugPathFromPathname = useMemo(() => {
    return (pathname ?? "").replace(/^\/+/, "");
  }, [pathname]);

  const prefetchNext = useCallback(
    (next: ListingFilters) => {
      if (!slugPathFromPathname) return;

      const f = normalizeFilters(next);

      // build backend URL directly (EN keys), because backend expects brand/size/color/material/min/max/sort/page/per_page
      const backend = new URLSearchParams();

      for (const v of f.brand ?? []) backend.append("brand", v);
      for (const v of f.size ?? []) backend.append("size", v);
      for (const v of f.color ?? []) backend.append("color", v);
      for (const v of f.material ?? []) backend.append("material", v);

      if (f.min != null) backend.set("min", String(Math.round(f.min)));
      if (f.max != null) backend.set("max", String(Math.round(f.max)));

      if (f.sort && f.sort !== "podrazumevano") backend.set("sort", f.sort);
      if (f.page && f.page > 1) backend.set("page", String(f.page));

      if (f.perPage && f.perPage !== 24) backend.set("per_page", String(f.perPage));

      const qs = backend.toString();
      const url = qs
        ? `/api/category/${slugPathFromPathname}/products?${qs}`
        : `/api/category/${slugPathFromPathname}/products`;

      const key = ["catProducts", slugPathFromPathname, url] as const;

      qc.prefetchQuery({
        queryKey: key,
        queryFn: ({ signal }) => apiGet<any>(url, undefined, signal),
        staleTime: 60_000,
      });
    },
    [qc, slugPathFromPathname]
  );

  const push = useCallback(
    (next: ListingFilters, mode: PushMode = "commit") => {
      const normalized = normalizeFilters(next);
      if (mode === "draft") return normalized;

      prefetchNext(normalized);

      const qs = filtersToSearchParams(normalized).toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      return normalized;
    },
    [router, pathname, prefetchNext]
  );

  const toggleMulti = useCallback(
    (key: "brand" | "size" | "color" | "material", value: string) => {
      const current = Array.isArray(filters[key]) ? (filters[key] as string[]) : [];
      const exists = current.includes(value);
      const nextArr = exists ? current.filter((v) => v !== value) : [...current, value];
      push({ ...filters, [key]: nextArr, page: 1 }, "commit");
    },
    [filters, push]
  );

  const removeMulti = useCallback(
    (key: "brand" | "size" | "color" | "material", value: string) => {
      const current = Array.isArray(filters[key]) ? (filters[key] as string[]) : [];
      push({ ...filters, [key]: current.filter((v) => v !== value), page: 1 }, "commit");
    },
    [filters, push]
  );

  const setPriceDraft = useCallback(
    (min: number | null, max: number | null) => {
      push({ ...filters, min, max, page: 1 }, "draft");
    },
    [filters, push]
  );

  const setPrice = useCallback(
    (min: number | null, max: number | null) => {
      push({ ...filters, min, max, page: 1 }, "commit");
    },
    [filters, push]
  );

  const setSort = useCallback(
    (sort: SortKey) => {
      push({ ...filters, sort, page: 1 }, "commit");
    },
    [filters, push]
  );

  const setPage = useCallback(
    (page: number) => {
      push({ ...filters, page }, "commit");
    },
    [filters, push]
  );

  const setPerPage = useCallback(
    (perPage: number) => {
      push({ ...filters, perPage, page: 1 }, "commit");
    },
    [filters, push]
  );

  const setView = useCallback(
    (view: ViewMode) => {
      push({ ...filters, view, page: 1 }, "commit");
    },
    [filters, push]
  );

  const resetAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return {
    filters,
    toggleMulti,
    removeMulti,
    setPriceDraft,
    setPrice,
    setSort,
    setPage,
    setPerPage,
    setView,
    resetAll,
  };
}
