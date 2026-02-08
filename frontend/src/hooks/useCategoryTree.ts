"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

export type CategoryNode = {
  id: number;
  name: string;
  slug?: string;
  slug_path: string;
  depth?: number;
  children?: CategoryNode[];
};

export type CategoriesTreeResponse = { items: CategoryNode[] };

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(
  /\/$/,
  ""
);

function normalizeSlugPath(p: string) {
  return p.replace(/^\/+|\/+$/g, "");
}

function buildBySlugPath(items: CategoryNode[]) {
  const map = new Map<string, CategoryNode>();

  const walk = (nodes: CategoryNode[]) => {
    for (const n of nodes) {
      const key = normalizeSlugPath(n.slug_path || "");
      if (key) map.set(key, n);
      if (n.children?.length) walk(n.children);
    }
  };

  walk(items);
  return map;
}

export function useCategoryTree() {
  const query = useQuery<CategoriesTreeResponse>({
    queryKey: ["categoriesTree"],
    queryFn: async ({ signal }) => {
      const res = await fetch(`${API_BASE}/api/categories/tree`, {
        signal,
        headers: { accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Tree API ${res.status}: ${txt}`);
      }

      return (await res.json()) as CategoriesTreeResponse;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const bySlugPath = React.useMemo(() => {
    const items = query.data?.items ?? [];
    return buildBySlugPath(items);
  }, [query.data]);

  // Vraćamo sve iz react-query + dodatni indeks
  return Object.assign(query, { bySlugPath });
}
