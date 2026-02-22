import type { ProductListingItem } from "@/hooks/useCategoryProducts";

const nfSR = new Intl.NumberFormat("sr-RS");

export function formatRSD(n: number) {
  return nfSR.format(Math.round(n)) + " RSD";
}

/**
 * Parsira cenu iz:
 * - number (12990)
 * - "12.990 RSD"
 * - "12.990,00"
 * - "12,990"
 * - "12 990"
 * - "RSD 12.990"
 */
function parseMoney(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;

  if (typeof x !== "string") return null;

  const s = x.trim();
  if (!s) return null;

  const m = s.match(/-?\d[\d\s.,]*/);
  if (!m) return null;

  let t = m[0].replace(/\s+/g, "");

  const hasDot = t.includes(".");
  const hasComma = t.includes(",");

  if (hasDot && hasComma) {
    t = t.replace(/\./g, "").replace(/,/g, ".");
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n) : null;
  }

  if (hasComma && !hasDot) {
    const idx = t.lastIndexOf(",");
    const dec = t.slice(idx + 1);
    const intPart = t.slice(0, idx);

    if (dec.length > 0 && dec.length <= 2) {
      const normalized = intPart.replace(/,/g, "") + "." + dec;
      const n = Number(normalized);
      return Number.isFinite(n) ? Math.round(n) : null;
    }

    const digits = t.replace(/[^\d-]/g, "");
    if (!digits || digits === "-") return null;
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
  }

  const digits = t.replace(/[^\d-]/g, "");
  if (!digits || digits === "-") return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

function calcPercentOff(oldP: number | null, curP: number | null): number | null {
  if (oldP == null || curP == null) return null;
  if (oldP <= 0) return null;
  if (curP >= oldP) return null;
  const pct = Math.round((1 - curP / oldP) * 100);
  return pct > 0 ? pct : null;
}

type PriceInfo = {
  current: number | null;
  old: number | null;
  percentOff: number | null;
};

function getAny(obj: any, path: string): unknown {
  const parts = path.split(".");
  let cur = obj;
  for (const k of parts) {
    if (cur == null) return null;
    cur = cur[k];
  }
  return cur;
}

/**
 * ✅ Robust extractor:
 * pokriva polja koja tvoj API realno vraća:
 * - price_rsd
 * - old_price_rsd
 * - percent_off
 * - price_regular_rsd
 * - price_mp_discounted_rsd
 * - compare_at_rsd
 */
export function extractPrice(p: ProductListingItem): PriceInfo {
  const a: any = p as any;

  // Kandidati za CURRENT (sale/current)
  const currentCandidates: unknown[] = [
    // "shop" API
    a.price_mp_discounted_rsd,
    a.sale_price,
    a.discount_price,
    a.discounted_price,
    a.price_sale,
    a.current_price,
    a.price_current,
    a.price_now,
    a.price_rsd,
    a.price,
    a.amount,

    // nested
    getAny(a, "prices.current"),
    getAny(a, "prices.sale"),
    getAny(a, "pricing.current"),
    getAny(a, "pricing.sale"),
    getAny(a, "price.current"),
    getAny(a, "price.sale"),
    getAny(a, "price.amount"),
    getAny(a, "price.value"),
    getAny(a, "price.rsd"),
    getAny(a, "price.gross"),
    getAny(a, "price.net"),
  ];

  // Kandidati za OLD (regular/list/original)
  const oldCandidates: unknown[] = [
    // "shop" API
    a.old_price_rsd,
    a.price_regular_rsd,
    a.compare_at_rsd,

    a.regular_price,
    a.list_price,
    a.original_price,
    a.old_price,
    a.price_old,
    a.price_before,
    a.compare_at_price,

    // nested
    getAny(a, "prices.old"),
    getAny(a, "prices.regular"),
    getAny(a, "pricing.old"),
    getAny(a, "pricing.regular"),
    getAny(a, "price.old"),
    getAny(a, "price.regular"),
    getAny(a, "price.compare_at"),
  ];

  // Kandidati za procenat
  const percentCandidates: unknown[] = [
    // "shop" API
    a.percent_off,

    a.discount_percent,
    a.discount_percentage,
    a.sale_percent,
    a.sale_percentage,

    getAny(a, "prices.percent_off"),
    getAny(a, "pricing.percent_off"),
    getAny(a, "price.percent_off"),
  ];

  let current: number | null = null;
  for (const v of currentCandidates) {
    const n = parseMoney(v);
    if (n != null) {
      current = n;
      break;
    }
  }

  let old: number | null = null;
  for (const v of oldCandidates) {
    const n = parseMoney(v);
    if (n != null) {
      old = n;
      break;
    }
  }

  // fallback: ako nema mp_discounted, koristi price_rsd/price
  if (current == null) {
    const fallback = parseMoney(a.price_rsd ?? a.price);
    if (fallback != null) current = fallback;
  }

  if (old != null && current != null && old <= current) {
    old = null;
  }

  let percentOff: number | null = null;
  for (const v of percentCandidates) {
    const n = parseMoney(v);
    if (n != null) {
      const pct = Math.max(0, Math.min(100, Math.round(n)));
      percentOff = pct > 0 ? pct : null;
      break;
    }
  }

  if (percentOff == null) {
    percentOff = calcPercentOff(old, current);
  }

  return { current, old, percentOff };
}