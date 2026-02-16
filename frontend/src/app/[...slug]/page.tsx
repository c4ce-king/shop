import type { Metadata } from "next";
import CategoryListingClient from "@/components/catalog/CategoryListingClient";
import ProductPageClient from "@/components/product/ProductPageClient";

type Props = { params: Promise<{ slug?: string[] }> };

type ResolveResponse =
  | { type: "home" }
  | { type: "category"; slug_path: string; category_id: number }
  | { type: "product"; slug: string }
  | { type: "not_found" };

async function apiFetchJson(path: string) {
  const base = process.env.BACKEND_URL;
  if (!base) throw new Error("BACKEND_URL missing in .env.local");

  const res = await fetch(`${base}${path}`, {
    // metadata treba da bude “fresh enough”
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return null;
  return res.json();
}

async function resolvePath(slugPath: string): Promise<ResolveResponse | null> {
  const q = encodeURIComponent(slugPath);
  return apiFetchJson(`/api/resolve?path=${q}`);
}

async function fetchCategoryName(slugPath: string): Promise<string | null> {
  // categoryProducts vraća category.name
  const data = await apiFetchJson(`/api/category/${slugPath}/products?per_page=1`);
  const name = data?.category?.name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

async function fetchProductName(productSlug: string): Promise<string | null> {
  const data = await apiFetchJson(`/api/product/${productSlug}`);
  const name = data?.name ?? data?.title;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug ?? [];
  const slugPath = parts.join("/");

  if (!slugPath) return { title: "Shop" };

  // probaj resolve (ako je implementiran)
  const r = await resolvePath(slugPath);

  // Ako je category:
  if (r?.type === "category") {
    const catName = await fetchCategoryName(r.slug_path);
    return { title: catName ? `${catName} | Shop` : `Shop` };
  }

  // Ako je product:
  // (čak i ako resolve ne zna product, fallback heuristika: poslednji segment je product slug)
  const productSlug = parts.at(-1) ?? slugPath;
  const catPath = parts.slice(0, -1).join("/");

  const productName = await fetchProductName(productSlug);
  const catName = catPath ? await fetchCategoryName(catPath) : null;

  if (productName && catName) return { title: `${catName} — ${productName} | Shop` };
  if (productName) return { title: `${productName} | Shop` };
  if (catName) return { title: `${catName} | Shop` };

  return { title: "Shop" };
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  const parts = slug ?? [];
  const slugPath = parts.join("/");

  // home
  if (!slugPath) return <CategoryListingClient slugPath="" />;

  // resolve (optional)
  const r = await resolvePath(slugPath);

  // category
  if (r?.type === "category") {
    return <CategoryListingClient slugPath={r.slug_path} />;
  }

  // product (fallback heuristika)
  const productSlug = parts.at(-1) ?? slugPath;

  // cat listing ako ima samo 1 segment? (po želji)
  if (parts.length <= 1) {
    return <CategoryListingClient slugPath={slugPath} />;
  }

  return <ProductPageClient slug={productSlug} />;
}
