export const SITE_NAME: string = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "NAZIV_SAJTA";

export function buildProductTitle(categoryLabel: string, productName?: string | null) {
  const cat = (categoryLabel || "Katalog").trim();
  const name = (productName || "").trim();
  if (name) return `${SITE_NAME} | ${cat} | ${name}`;
  return `${SITE_NAME} | ${cat}`;
}
