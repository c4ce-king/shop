"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import { useCategoryTree, type CategoryNode } from "@/hooks/useCategoryTree";
import { categoryProductsQueryKey, fetchCategoryProducts } from "@/hooks/useCategoryProducts";

function limitTop(items: CategoryNode[]) {
  return items.slice(0, 14);
}

function findNodeById(items: CategoryNode[], id: number | null): CategoryNode | null {
  if (!id) return null;
  const stack = [...items];
  while (stack.length) {
    const n = stack.shift()!;
    if (n.id === id) return n;
    if (n.children?.length) stack.push(...n.children);
  }
  return null;
}

const DEFAULT_FILTERS = {} as any;

export function MegaMenu() {
  const q = useCategoryTree();
  const items = q.data?.items ?? [];
  const top = useMemo(() => limitTop(items), [items]);

  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const active = useMemo(() => {
    return findNodeById(top, activeId ?? top[0]?.id ?? null);
  }, [activeId, top]);

  const activeChildren = active?.children ?? [];

  const prefetchCategory = useCallback(
    (slugPath?: string | null) => {
      if (!slugPath) return;

      qc.prefetchQuery({
        queryKey: categoryProductsQueryKey(slugPath, DEFAULT_FILTERS),
        queryFn: ({ signal }) => fetchCategoryProducts(slugPath, DEFAULT_FILTERS, signal),
        staleTime: 60_000,
      });
    },
    [qc]
  );

  // ✅ DEV-friendly: warm prefetch samo za active (1 request), da ne okida gomilu compile-a
  useEffect(() => {
    if (!open) return;
    prefetchCategory(active?.slug_path);
  }, [open, active?.slug_path, prefetchCategory]);

  const openMenu = () => {
    setOpen(true);
    setActiveId((prev) => prev ?? top[0]?.id ?? null);
  };

  const closeMenu = () => setOpen(false);

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <button
        type="button"
        className="text-sm font-medium px-3 py-2 rounded-full hover:bg-black/5"
        aria-haspopup="menu"
        aria-expanded={open}
        onFocus={openMenu}
      >
        Kategorije
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mega"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full pt-3 z-50"
          >
            <div className="w-[980px] rounded-2xl border bg-white shadow-lg overflow-hidden">
              <div className="grid grid-cols-12">
                <div className="col-span-3 border-r bg-white">
                  <div className="p-3">
                    <div className="text-xs uppercase tracking-wide text-black/50 mb-2">Kategorije</div>

                    {q.isLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="h-9 rounded-lg bg-black/5 animate-pulse" />
                        ))}
                      </div>
                    ) : top.length === 0 ? (
                      <div className="text-sm text-black/60">Nema kategorija.</div>
                    ) : (
                      <div className="space-y-1">
                        {top.map((c) => {
                          const isActive = (active?.id ?? null) === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onMouseEnter={() => {
                                setActiveId(c.id);
                                prefetchCategory(c.slug_path);
                              }}
                              onFocus={() => {
                                setActiveId(c.id);
                                prefetchCategory(c.slug_path);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                                isActive ? "bg-black text-white" : "hover:bg-black/5"
                              }`}
                            >
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-9 p-4">
                  {!active ? (
                    <div className="text-sm text-black/60">—</div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold">{active.name}</div>
                        <Link
                          href={`/${active.slug_path}`}
                          prefetch
                          onMouseEnter={() => prefetchCategory(active.slug_path)}
                          onFocus={() => prefetchCategory(active.slug_path)}
                          onTouchStart={() => prefetchCategory(active.slug_path)}
                          className="text-sm underline text-black/70 hover:text-black"
                        >
                          Pogledaj sve
                        </Link>
                      </div>

                      {activeChildren.length === 0 ? (
                        <div className="text-sm text-black/60">Nema podkategorija.</div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          {activeChildren.slice(0, 9).map((child) => (
                            <div key={child.id} className="min-w-0">
                              <Link
                                href={`/${child.slug_path}`}
                                prefetch
                                onMouseEnter={() => prefetchCategory(child.slug_path)}
                                onFocus={() => prefetchCategory(child.slug_path)}
                                onTouchStart={() => prefetchCategory(child.slug_path)}
                                className="text-sm font-medium hover:underline block truncate"
                              >
                                {child.name}
                              </Link>

                              <div className="mt-2 space-y-1">
                                {(child.children ?? []).slice(0, 8).map((leaf) => (
                                  <Link
                                    key={leaf.id}
                                    href={`/${leaf.slug_path}`}
                                    prefetch
                                    onMouseEnter={() => prefetchCategory(leaf.slug_path)}
                                    onFocus={() => prefetchCategory(leaf.slug_path)}
                                    onTouchStart={() => prefetchCategory(leaf.slug_path)}
                                    className="text-sm text-black/70 hover:text-black block truncate"
                                  >
                                    {leaf.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t px-4 py-3 flex items-center justify-between">
                <div className="text-xs text-black/50">Hover = prefetch, klik = instant</div>
                <Link href="/" prefetch className="text-xs underline text-black/70 hover:text-black">
                  Početna
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
