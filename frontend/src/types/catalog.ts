export type SortKey =
  | "podrazumevano"
  | "najnovije"
  | "cena_gore"
  | "cena_dole"
  | "popularno"
  | "snizenje"
  | "ocena";

export type FacetValue = {
  value: string;
  count: number;
  label?: string; // optional - if backend ever provides human label
};

export type Facets = Partial<{
  brand: FacetValue[];
  size: FacetValue[];
  color: FacetValue[];
  material: FacetValue[];
}>;

export type PriceMeta = {
  min: number;
  max: number;
};

export type ProductListItem = {
  id: number | string;
  slug: string;
  title: string;
  price: number;
  old_price?: number | null;
  currency?: string | null;
  image?: string | null;
  image_alt?: string | null;
  brand?: string | null;
};

export type CategoryProductsResponse = {
  products: ProductListItem[];
  total?: number;
  page?: number;
  per_page?: number;

  facets: Facets;
  price: PriceMeta;

  category?: {
    id: number | string;
    name: string;
    slug_path: string;
  };
};
