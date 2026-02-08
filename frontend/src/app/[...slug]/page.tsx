import CategoryListingClient from "@/components/catalog/CategoryListingClient";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  const slugPath = (slug ?? []).join("/");
  return <CategoryListingClient slugPath={slugPath} />;
}
