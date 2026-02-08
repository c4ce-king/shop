"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type SortKey =
  | "podrazumevano"
  | "najnovije"
  | "cena_gore"
  | "cena_dole"
  | "popularno"
  | "snizenje"
  | "ocena";

export type ListingFilters = {
  brand?: string[];
  size?: string[];
  color?: string[];
  material?: string[];
  min?: number | null;
  max?: number | null;
  sort?: SortKey;
  page?: number;
};

/**
 * SR query keys:
 * brend, velicina, boja, materijal, cena_min, cena_max, sort, strana
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
} as const;

/**
 * Backward compat EN keys (ako postoje stari linkovi)
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

  return sp;
}

/**
 * Parse URL (SR first, fallback EN), decode SR values -> backend codes
 */
function parseFromSearchParams(sp: ReturnType<typeof useSearchParams>): ListingFilters {
  const getAll = (key: keyof typeof SR_KEYS) => {
    const sr = sp.getAll(SR_KEYS[key]).filter(Boolean);
    if (sr.length) return sr;
    return sp.getAll((EN_KEYS as any)[key]).filter(Boolean);
  };

  const getOne = (key: keyof typeof SR_KEYS) => {
    const sr = sp.get(SR_KEYS[key]);
    if (sr != null) return sr;
    return sp.get((EN_KEYS as any)[key]);
  };

  const brand = getAll("brand").map((v) => decodeValue("brand", v));
  const size = getAll("size").map((v) => decodeValue("size", v));
  const color = getAll("color").map((v) => decodeValue("color", v));
  const material = getAll("material").map((v) => decodeValue("material", v));

  return normalizeFilters({
    brand,
    size,
    color,
    material,
    min: toNumber(getOne("min")),
    max: toNumber(getOne("max")),
    sort: normalizeSort(getOne("sort")),
    page: toNumber(getOne("page")) ?? 1,
  });
}

type PushMode = "commit" | "draft";

export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const filters = useMemo(() => parseFromSearchParams(sp), [sp]);

  /**
   * push(commit): menja URL (router.push) i triggeruje refetch
   * push(draft): vrati samo normalized objekat (bez URL update)
   */
  const push = useCallback(
    (next: ListingFilters, mode: PushMode = "commit") => {
      const normalized = normalizeFilters(next);
      if (mode === "draft") return normalized;

      const qs = filtersToSearchParams(normalized).toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      return normalized;
    },
    [router, pathname]
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

  // DRAFT: nema router.push (koristi se za slider drag)
  const setPriceDraft = useCallback(
    (min: number | null, max: number | null) => {
      push({ ...filters, min, max, page: 1 }, "draft");
    },
    [filters, push]
  );

  // COMMIT: router.push
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

  const resetAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, toggleMulti, removeMulti, setPriceDraft, setPrice, setSort, setPage, resetAll };
}
