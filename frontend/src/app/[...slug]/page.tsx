import CategoryListingClient from "@/components/catalog/CategoryListingClient";

import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

function categoryProductsUrl(slugPath: string) {
  return `/api/category/${slugPath}/products`;
}

function categoryProductsQueryKey(slugPath: string) {
  const url = categoryProductsUrl(slugPath);
  return ["catProducts", slugPath, url] as const;
}

async function fetchCategoryProductsServer(slugPath: string) {
  const base = process.env.BACKEND_URL;
  if (!base) throw new Error("BACKEND_URL missing in .env.local");

  const res = await fetch(`${base}${categoryProductsUrl(slugPath)}`, {
    next: { revalidate: 30 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  const slugPath = (slug ?? []).join("/");

  const qc = new QueryClient();
  const isProd = process.env.NODE_ENV === "production";

  // ✅ samo u prod, da dev ne “visi”
  if (isProd && slugPath) {
    const data = await fetchCategoryProductsServer(slugPath);
    if (data) {
      qc.setQueryData(categoryProductsQueryKey(slugPath), data);
    }
  }

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <CategoryListingClient slugPath={slugPath} />
    </HydrationBoundary>
  );
}
