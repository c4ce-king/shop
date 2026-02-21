import type { Metadata } from "next";
import CategoryListingClient from "@/components/catalog/CategoryListingClient";
import ProductPageClient from "@/components/product/ProductPageClient";

type Props = { params: Promise<{ slug?: string[] }> };

type ResolveResponse =
  | { type: "home" }
  | { type: "category"; slug_path: string; category_id: number }
  | { type: "product"; slug: string; product_id?: number; category_slug_path?: string | null }
  | { type: "not_found" };

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Shop";
const RESOLVE_REVALIDATE_SECONDS = 3600; // 1h (safe: ne zavisi od filtera)

async function apiFetchJson(path: string, opts?: { revalidateSeconds?: number; noStore?: boolean }) {
  const base = process.env.BACKEND_URL;
  if (!base) throw new Error("BACKEND_URL missing in .env.local");

  const noStore = opts?.noStore ?? false;
  const revalidateSeconds = opts?.revalidateSeconds;

  const res = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json" },
    ...(noStore ? { cache: "no-store" as const } : {}),
    ...(revalidateSeconds != null ? { next: { revalidate: revalidateSeconds } } : {}),
  });

  if (!res.ok) return null;
  return res.json();
}

async function resolvePath(slugPath: string): Promise<ResolveResponse | null> {
  const q = encodeURIComponent(slugPath);

  // ✅ Keširamo resolve jer se ne menja na filter klik (menja se samo query string)
  return apiFetchJson(`/api/resolve?path=${q}`, { revalidateSeconds: RESOLVE_REVALIDATE_SECONDS });
}

function safeDecodeSegment(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function canonicalPathFor(slugPath: string) {
  const clean = (slugPath ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!clean) return "/";
  // encodeURI ostavlja "/" ali enkoduje razmake i sl. u segmentima
  return `/${encodeURI(clean)}`;
}

// ✅ Najbrže: bez backend poziva u metadata (da filter klik ne “ubija” UX)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug ?? [];
  const slugPath = parts.join("/");

  if (!slugPath) {
    // Pusti root layout da odluči default title (da ne dobiješ "Shop | Shop")
    return {};
  }

  const last = safeDecodeSegment(parts.at(-1) ?? "");
  const title = last || SITE_NAME;

  return {
    title, // layout template će dodati `| SITE_NAME`
    alternates: { canonical: canonicalPathFor(slugPath) },
  };
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  const parts = slug ?? [];
  const slugPath = parts.join("/");

  if (!slugPath) return <CategoryListingClient slugPath="" />;

  const r = await resolvePath(slugPath);

  if (r?.type === "category") {
    return <CategoryListingClient slugPath={r.slug_path} />;
  }

  if (r?.type === "product") {
    return <ProductPageClient slug={r.slug} />;
  }

  // fallback heuristika
  const productSlug = parts.at(-1) ?? slugPath;

  // 1 segment bez resolve-hit-a tretiramo kao category
  if (parts.length <= 1) {
    return <CategoryListingClient slugPath={slugPath} />;
  }

  return <ProductPageClient slug={productSlug} />;
}