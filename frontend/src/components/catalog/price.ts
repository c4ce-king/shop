// src/components/catalog/price.ts
import type { ProductListingItem } from "@/hooks/useCategoryProducts";

const nfRSD = new Intl.NumberFormat("sr-RS");

export function formatRSD(n: number) {
  return `${nfRSD.format(Math.round(n))} RSD`;
}

export type PriceInfo = { current: number | null; old: number | null; percentOff: number | null };

/**
 * Heuristika dok ne potvrdimo tačna polja iz API-ja.
 * (RSD je broj — formatiramo ovde.)
 */
export function extractPrice(p: ProductListingItem): PriceInfo {
  const a = p as any;

  const toNum = (v: any): number | null => {
    if (v == null) return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const current =
    toNum(a.price_current) ??
    toNum(a.price) ??
    toNum(a.price_rsd) ??
    toNum(a.current_price) ??
    toNum(a.final_price) ??
    toNum(a.unit_price) ??
    null;

  const sale =
    toNum(a.sale_price) ??
    toNum(a.price_sale) ??
    toNum(a.discount_price) ??
    toNum(a.special_price) ??
    null;

  const regular =
    toNum(a.regular_price) ??
    toNum(a.price_regular) ??
    toNum(a.old_price) ??
    toNum(a.price_old) ??
    toNum(a.base_price) ??
    null;

  let cur = current;
  let old: number | null = null;

  if (sale != null) {
    cur = sale;
    const candidateOld = regular ?? current;
    old = candidateOld != null && candidateOld > sale ? candidateOld : null;
  } else if (regular != null && current != null && regular > current) {
    old = regular;
  }

  const percentOff =
    old != null && cur != null && old > 0 && old > cur ? Math.min(99, Math.round(((old - cur) / old) * 100)) : null;

  return { current: cur, old, percentOff };
}