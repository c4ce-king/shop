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
  brand?: string[];
  size?: string[];
  color?: string[]; // canonical: backend codes (red/black/gray...)
  material?: string[]; // canonical: backend codes (latex/leather/...)
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
 *  SR <-> CODE mapping
 * -------------------------
 * URL (SR latin) <-> canonical code (backend)
 */

const COLOR_CODE_TO_SR: Record<string, string> = {
  black: "crna",
  white: "bela",
  red: "crvena",
  green: "zelena",
  gray: "siva", // canonical
  blue: "plava",
  pink: "roze",
  purple: "ljubicasta",
  yellow: "zuta",
  orange: "narandzasta",
  brown: "braon",
  transparent: "providna",
};

// alias -> canonical (npr. grey -> gray)
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

  // već SR?
  if (COLOR_SR_TO_CODE[v]) return v;

  // alias -> canonical
  const canon = COLOR_CODE_ALIASES[v] ?? v;

  // code -> SR
  return COLOR_CODE_TO_SR[canon] ?? canon;
}

function decodeColorToCode(codeOrSr: string): string {
  const v0 = normKeyValue(codeOrSr);

  // SR -> code
  const mapped = COLOR_SR_TO_CODE[v0];
  const v = mapped ? mapped : v0;

  // alias -> canonical
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

export function normalizeFilters(f: ListingFilters): ListingFilters {
  const out: ListingFilters = { ...f };

  if (out.brand) out.brand = uniq(out.brand);
  if (out.size) out.size = uniq(out.size);

  // canonical codes
  if (out.color) out.color = uniq(out.color.map(decodeColorToCode));
  if (out.material) out.material = uniq(out.material.map(decodeMaterialToCode));

  if (out.page != null) out.page = Math.max(1, Math.floor(out.page));
  if (out.perPage != null) out.perPage = Math.max(1, Math.floor(out.perPage));

  return out;
}

function parseFiltersFromSearchParams(sp: URLSearchParams): ListingFilters {
  const brand = getAllCompat(sp, ["brend", "brand"]);
  const size = getAllCompat(sp, ["velicina", "size"]);

  const colorRaw = getAllCompat(sp, ["boja", "color"]);
  const color = colorRaw.map(decodeColorToCode);

  const materialRaw = getAllCompat(sp, ["materijal", "material"]);
  const material = materialRaw.map(decodeMaterialToCode);

  const minRaw = getFirstCompat(sp, ["cena_min", "min"]);
  const maxRaw = getFirstCompat(sp, ["cena_max", "max"]);
  const min = parseNumber(minRaw);
  const max = parseNumber(maxRaw);

  const sortRaw = (getFirstCompat(sp, ["sort"]) ?? "podrazumevano").trim() as SortKey;
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

  return normalizeFilters({
    brand: brand.length ? brand : undefined,
    size: size.length ? size : undefined,
    color: color.length ? color : undefined,
    material: material.length ? material : undefined,
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

  // ✅ hydration-safe: init iz Next searchParams (isto na SSR i na clientu)
  const initialSpString = searchParams.toString();

  const [spString, setSpString] = React.useState<string>(initialSpString);

  // kada se ruta promeni (npr. odeš na drugu kategoriju), pokupi trenutni search iz URL-a
  React.useEffect(() => {
    setSpString(getLocationSearchString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Back/Forward: popstate -> pročitaj URL i osveži state
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

      // pushState => Back radi korak-po-korak
      window.history.pushState({}, "", url);

      // instant UI
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
    // draft je samo UI, ne ide u URL
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

  const toggleMulti = React.useCallback(
    (code: "brand" | "size" | "color" | "material", value: string) => {
      const sp = new URLSearchParams(spString);

      const srKey = code === "brand" ? "brend" : code === "size" ? "velicina" : code === "color" ? "boja" : "materijal";
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
    },
    [spString, push]
  );

  const removeMulti = React.useCallback(
    (code: "brand" | "size" | "color" | "material", value: string) => {
      const sp = new URLSearchParams(spString);

      const srKey = code === "brand" ? "brend" : code === "size" ? "velicina" : code === "color" ? "boja" : "materijal";
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
    setPriceDraft,
    setPrice,
    setSort,
    setPage,
    setPerPage,
    setView,
    resetAll,
  };
}
