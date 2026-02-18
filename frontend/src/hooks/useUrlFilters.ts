"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

export type ViewMode = "galerija" | "lista";

export type SortKey =
  | "podrazumevano"
  | "najnovije"
  | "cena_gore"
  | "cena_dole"
  | "popularno"
  | "snizenje"
  | "ocena";

export type ListingFilters = {
  // known facets
  brand?: string[];
  size?: string[];
  color?: string[]; // canonical backend codes
  material?: string[]; // canonical backend codes

  // ✅ dynamic facets (any other facet code from URL)
  facets?: Record<string, string[]>;

  // controls
  min?: number | null;
  max?: number | null;
  sort?: SortKey;
  page?: number;
  perPage?: number;
  view?: ViewMode;
};

function uniq(arr: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const v = String(x ?? "").trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function parseNumber(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function normKeyValue(v: string) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\+/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * -------------------------
 * SR <-> CODE mapping (URL canonical SR for known facets, EN accepted)
 * -------------------------
 */
const COLOR_CODE_TO_SR: Record<string, string> = {
  black: "crna",
  white: "bela",
  red: "crvena",
  green: "zelena",
  gray: "siva",
  blue: "plava",
  pink: "roze",
  purple: "ljubicasta",
  yellow: "zuta",
  orange: "narandzasta",
  brown: "braon",
  transparent: "providna",
};

const COLOR_CODE_ALIASES: Record<string, string> = {
  grey: "gray",
};

const COLOR_SR_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_CODE_TO_SR).map(([code, sr]) => [sr, code])
);

const MATERIAL_CODE_TO_SR: Record<string, string> = {
  latex: "lateks",
  glass: "staklo",
  metal: "metal",
  leather: "koza",
  silicone: "silikon",
  rubber: "guma",
  pvc: "pvc",
  tpe: "tpe",
  abs: "abs",
};

const MATERIAL_SR_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(MATERIAL_CODE_TO_SR).map(([code, sr]) => [sr, code])
);

function encodeColorToSr(codeOrSr: string): string {
  const v = normKeyValue(codeOrSr);
  if (COLOR_SR_TO_CODE[v]) return v;
  const canon = COLOR_CODE_ALIASES[v] ?? v;
  return COLOR_CODE_TO_SR[canon] ?? canon;
}

function decodeColorToCode(codeOrSr: string): string {
  const v0 = normKeyValue(codeOrSr);
  const mapped = COLOR_SR_TO_CODE[v0];
  const v = mapped ? mapped : v0;
  return COLOR_CODE_ALIASES[v] ?? v;
}

function encodeMaterialToSr(codeOrSr: string): string {
  const v = normKeyValue(codeOrSr);
  if (MATERIAL_SR_TO_CODE[v]) return v;
  return MATERIAL_CODE_TO_SR[v] ?? v;
}

function decodeMaterialToCode(codeOrSr: string): string {
  const v = normKeyValue(codeOrSr);
  if (MATERIAL_SR_TO_CODE[v]) return MATERIAL_SR_TO_CODE[v];
  return v;
}

function getAllCompat(sp: URLSearchParams, keys: string[]): string[] {
  const out: string[] = [];
  for (const k of keys) {
    for (const v of sp.getAll(k)) out.push(v);
    for (const v of sp.getAll(`${k}[]`)) out.push(v);
  }
  return uniq(out);
}

function getFirstCompat(sp: URLSearchParams, keys: string[]): string | null {
  for (const k of keys) {
    const v = sp.get(k);
    if (v != null && String(v).trim() !== "") return String(v);
    const v2 = sp.get(`${k}[]`);
    if (v2 != null && String(v2).trim() !== "") return String(v2);
  }
  return null;
}

function deleteKeys(sp: URLSearchParams, keys: string[]) {
  for (const k of keys) {
    sp.delete(k);
    sp.delete(`${k}[]`);
  }
}

function setArray(sp: URLSearchParams, key: string, values: string[]) {
  deleteKeys(sp, [key]);
  for (const v of uniq(values)) sp.append(key, v);
}

function isKnownFacet(code: string) {
  return code === "brand" || code === "size" || code === "color" || code === "material";
}

function srKeyForKnown(code: string) {
  if (code === "brand") return "brend";
  if (code === "size") return "velicina";
  if (code === "color") return "boja";
  return "materijal";
}

/**
 * ✅ used by useCategoryProducts.ts
 */
export function normalizeFilters(f: ListingFilters): ListingFilters {
  const out: ListingFilters = { ...f };

  if (out.brand) out.brand = uniq(out.brand);
  if (out.size) out.size = uniq(out.size);
  if (out.color) out.color = uniq(out.color.map(decodeColorToCode));
  if (out.material) out.material = uniq(out.material.map(decodeMaterialToCode));

  if (out.facets) {
    const next: Record<string, string[]> = {};
    for (const [k, arr] of Object.entries(out.facets)) {
      const a = Array.isArray(arr) ? uniq(arr) : [];
      if (a.length) next[k] = a;
    }
    out.facets = Object.keys(next).length ? next : undefined;
  }

  if (out.page != null) out.page = Math.max(1, Math.floor(out.page));
  if (out.perPage != null) out.perPage = Math.max(1, Math.floor(out.perPage));

  return out;
}

function parseFiltersFromSearchParams(sp: URLSearchParams): ListingFilters {
  // known facets: SR canonical, EN accepted
  const brand = getAllCompat(sp, ["brend", "brand"]);
  const size = getAllCompat(sp, ["velicina", "size"]);
  const colorRaw = getAllCompat(sp, ["boja", "color"]);
  const materialRaw = getAllCompat(sp, ["materijal", "material"]);

  const color = colorRaw.map(decodeColorToCode);
  const material = materialRaw.map(decodeMaterialToCode);

  // price
  const minRaw = getFirstCompat(sp, ["cena_min", "min"]);
  const maxRaw = getFirstCompat(sp, ["cena_max", "max"]);
  const min = parseNumber(minRaw);
  const max = parseNumber(maxRaw);

  // controls
  const sortRaw = (getFirstCompat(sp, ["sort", "sortiranje"]) ?? "podrazumevano").trim() as SortKey;
  const allowedSort: SortKey[] = [
    "podrazumevano",
    "najnovije",
    "cena_gore",
    "cena_dole",
    "popularno",
    "snizenje",
    "ocena",
  ];
  const sort: SortKey = allowedSort.includes(sortRaw) ? sortRaw : "podrazumevano";

  const viewRaw = (getFirstCompat(sp, ["prikaz", "view"]) ?? "galerija").trim();
  const view: ViewMode = viewRaw === "lista" ? "lista" : "galerija";

  const pageRaw = getFirstCompat(sp, ["strana", "page"]);
  const pageNum = parseNumber(pageRaw);
  const page = pageNum != null ? Math.max(1, Math.floor(pageNum)) : 1;

  const perRaw = getFirstCompat(sp, ["po_strani", "per_page", "perPage"]);
  const perNum = parseNumber(perRaw);
  const perPage = perNum != null ? Math.max(1, Math.floor(perNum)) : 24;

  // ✅ dynamic facets: anything else in query params
  const reserved = new Set<string>([
    // known facet keys (SR + EN)
    "brend",
    "brand",
    "velicina",
    "size",
    "boja",
    "color",
    "materijal",
    "material",
    // price
    "cena_min",
    "cena_max",
    "min",
    "max",
    // controls
    "sort",
    "sortiranje",
    "page",
    "strana",
    "perPage",
    "per_page",
    "po_strani",
    "view",
    "prikaz",
  ]);

  const dynamic: Record<string, string[]> = {};
  // URLSearchParams doesn't directly expose all keys uniquely, so iterate entries
  for (const [k, v] of sp.entries()) {
    const key = k.endsWith("[]") ? k.slice(0, -2) : k;
    if (reserved.has(key)) continue;
    if (!key) continue;

    if (!dynamic[key]) dynamic[key] = [];
    dynamic[key].push(v);
  }

  // normalize dynamic facet arrays
  const dynamicNorm: Record<string, string[]> = {};
  for (const [k, arr] of Object.entries(dynamic)) {
    const u = uniq(arr);
    if (u.length) dynamicNorm[k] = u;
  }

  return normalizeFilters({
    brand: brand.length ? brand : undefined,
    size: size.length ? size : undefined,
    color: color.length ? color : undefined,
    material: material.length ? material : undefined,
    facets: Object.keys(dynamicNorm).length ? dynamicNorm : undefined,
    min: min != null ? min : null,
    max: max != null ? max : null,
    sort,
    page,
    perPage,
    view,
  });
}

function getLocationSearchString(): string {
  const s = window.location.search || "";
  return s.startsWith("?") ? s.slice(1) : s;
}

function buildUrl(pathname: string, qs: string): string {
  const hash = window.location.hash || "";
  return qs ? `${pathname}?${qs}${hash}` : `${pathname}${hash}`;
}

export function useUrlFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSpString = searchParams.toString();
  const [spString, setSpString] = React.useState<string>(initialSpString);

  React.useEffect(() => {
    setSpString(getLocationSearchString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  React.useEffect(() => {
    const onPop = () => setSpString(getLocationSearchString());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const filters = React.useMemo(() => {
    return parseFiltersFromSearchParams(new URLSearchParams(spString));
  }, [spString]);

  const push = React.useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      const url = buildUrl(pathname, qs);
      window.history.pushState({}, "", url);
      setSpString(qs);
    },
    [pathname]
  );

  const resetPage = (sp: URLSearchParams) => {
    sp.delete("page");
    sp.delete("strana");
  };

  const setPage = React.useCallback(
    (page: number) => {
      const sp = new URLSearchParams(spString);
      const p = Math.max(1, Math.floor(page));

      sp.delete("page");
      if (p <= 1) sp.delete("strana");
      else sp.set("strana", String(p));

      push(sp);
    },
    [spString, push]
  );

  const setSort = React.useCallback(
    (sort: SortKey) => {
      const sp = new URLSearchParams(spString);
      const s = (sort ?? "podrazumevano") as SortKey;

      sp.delete("sortiranje");
      if (s === "podrazumevano") sp.delete("sort");
      else sp.set("sort", s);

      resetPage(sp);
      push(sp);
    },
    [spString, push]
  );

  const setView = React.useCallback(
    (view: ViewMode) => {
      const sp = new URLSearchParams(spString);
      const v: ViewMode = view === "lista" ? "lista" : "galerija";

      sp.delete("view");
      if (v === "galerija") sp.delete("prikaz");
      else sp.set("prikaz", v);

      resetPage(sp);
      push(sp);
    },
    [spString, push]
  );

  const setPerPage = React.useCallback(
    (perPage: number) => {
      const sp = new URLSearchParams(spString);
      const p = Math.max(1, Math.floor(perPage));

      sp.delete("per_page");
      sp.delete("perPage");

      if (p === 24) sp.delete("po_strani");
      else sp.set("po_strani", String(p));

      resetPage(sp);
      push(sp);
    },
    [spString, push]
  );

  const setPriceDraft = React.useCallback((_min: number | null, _max: number | null) => {
    // UI-only
  }, []);

  const setPrice = React.useCallback(
    (min: number | null, max: number | null) => {
      const sp = new URLSearchParams(spString);

      sp.delete("min");
      sp.delete("max");

      if (min == null) sp.delete("cena_min");
      else sp.set("cena_min", String(Math.round(min)));

      if (max == null) sp.delete("cena_max");
      else sp.set("cena_max", String(Math.round(max)));

      resetPage(sp);
      push(sp);
    },
    [spString, push]
  );

  /**
   * ✅ Generic facet ops:
   * - known facets keep SR canonical keys (brend/velicina/boja/materijal)
   * - unknown facets use key = facet code
   */
  const toggleMulti = React.useCallback(
    (code: string, value: string) => {
      const sp = new URLSearchParams(spString);

      if (isKnownFacet(code)) {
        const srKey = srKeyForKnown(code);
        const enKey = code;

        deleteKeys(sp, [enKey]);

        const currentUrlVals = getAllCompat(sp, [srKey]);

        let currentCodes: string[] = currentUrlVals;
        if (code === "color") currentCodes = currentUrlVals.map(decodeColorToCode);
        if (code === "material") currentCodes = currentUrlVals.map(decodeMaterialToCode);

        const set = new Set(currentCodes);
        const vCode =
          code === "color" ? decodeColorToCode(value) : code === "material" ? decodeMaterialToCode(value) : String(value);

        if (set.has(vCode)) set.delete(vCode);
        else set.add(vCode);

        const nextCodes = Array.from(set);

        if (code === "color") setArray(sp, srKey, nextCodes.map(encodeColorToSr));
        else if (code === "material") setArray(sp, srKey, nextCodes.map(encodeMaterialToSr));
        else setArray(sp, srKey, nextCodes);

        resetPage(sp);
        push(sp);
        return;
      }

      // dynamic facet (key=code)
      const key = code;
      const current = getAllCompat(sp, [key]);
      const set = new Set(current);
      const v = String(value);

      if (set.has(v)) set.delete(v);
      else set.add(v);

      const next = Array.from(set);
      if (next.length) setArray(sp, key, next);
      else deleteKeys(sp, [key]);

      resetPage(sp);
      push(sp);
    },
    [spString, push]
  );

  const removeMulti = React.useCallback(
    (code: string, value: string) => {
      const sp = new URLSearchParams(spString);

      if (isKnownFacet(code)) {
        const srKey = srKeyForKnown(code);
        const enKey = code;

        deleteKeys(sp, [enKey]);

        const currentUrlVals = getAllCompat(sp, [srKey]);

        let currentCodes: string[] = currentUrlVals;
        if (code === "color") currentCodes = currentUrlVals.map(decodeColorToCode);
        if (code === "material") currentCodes = currentUrlVals.map(decodeMaterialToCode);

        const vCode =
          code === "color" ? decodeColorToCode(value) : code === "material" ? decodeMaterialToCode(value) : String(value);

        const nextCodes = currentCodes.filter((x) => x !== vCode);

        if (nextCodes.length === 0) {
          deleteKeys(sp, [srKey]);
        } else {
          if (code === "color") setArray(sp, srKey, nextCodes.map(encodeColorToSr));
          else if (code === "material") setArray(sp, srKey, nextCodes.map(encodeMaterialToSr));
          else setArray(sp, srKey, nextCodes);
        }

        resetPage(sp);
        push(sp);
        return;
      }

      const key = code;
      const current = getAllCompat(sp, [key]);
      const v = String(value);
      const next = current.filter((x) => x !== v);

      if (next.length) setArray(sp, key, next);
      else deleteKeys(sp, [key]);

      resetPage(sp);
      push(sp);
    },
    [spString, push]
  );

  const clearMulti = React.useCallback(
    (code: string) => {
      const sp = new URLSearchParams(spString);

      if (isKnownFacet(code)) {
        const srKey = srKeyForKnown(code);
        const enKey = code;
        deleteKeys(sp, [enKey, srKey]);
        resetPage(sp);
        push(sp);
        return;
      }

      deleteKeys(sp, [code]);
      resetPage(sp);
      push(sp);
    },
    [spString, push]
  );

  const resetAll = React.useCallback(() => {
    push(new URLSearchParams());
  }, [push]);

  return {
    filters,
    toggleMulti,
    removeMulti,
    clearMulti,
    setPriceDraft,
    setPrice,
    setSort,
    setPage,
    setPerPage,
    setView,
    resetAll,
  };
}
