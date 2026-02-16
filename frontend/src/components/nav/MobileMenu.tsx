"use client";

import * as React from "react";
import Link from "next/link";
import { X, ChevronRight, ChevronLeft, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useCategoryTree, type CategoryNode } from "@/hooks/useCategoryTree";

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

function topItems(items: CategoryNode[]) {
  return (items ?? []).slice(0, 40);
}

function byIdMap(items: CategoryNode[]) {
  const map = new Map<number, CategoryNode>();
  const stack = [...(items ?? [])];
  while (stack.length) {
    const n = stack.shift()!;
    map.set(n.id, n);
    if (n.children?.length) stack.push(...n.children);
  }
  return map;
}

type Panel =
  | { kind: "root" }
  | { kind: "node"; id: number };

export function MobileMenu({ open, onClose, basePrefix = "" }: { open: boolean; onClose: () => void; basePrefix?: string }) {
  const q = useCategoryTree();
  const items = q.data?.items ?? [];
  const top = React.useMemo(() => topItems(items), [items]);
  const map = React.useMemo(() => byIdMap(items), [items]);

  const [panel, setPanel] = React.useState<Panel>({ kind: "root" });
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setPanel({ kind: "root" });
      setQuery("");
    }
  }, [open]);

  const currentNode =
    panel.kind === "node" ? map.get(panel.id) ?? null : null;

  const list: CategoryNode[] =
    panel.kind === "root" ? top : (currentNode?.children ?? []);

  const filtered = React.useMemo(() => {
    const qv = query.trim().toLowerCase();
    if (!qv) return list;
    return list.filter((x) => String(x.name ?? "").toLowerCase().includes(qv));
  }, [list, query]);

  const title =
    panel.kind === "root" ? "Kategorije" : (currentNode?.name ?? "Kategorije");

  // close on ESC
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-50 bg-black/35"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-y-0 left-0 z-50 w-[92vw] max-w-sm bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Meni"
          >
            {/* Header */}
            <div className="border-b bg-white">
              <div className="flex items-center gap-2 p-3">
                {panel.kind === "node" ? (
                  <button
                    type="button"
                    className="mic-btn h-10 w-10 p-0"
                    onClick={() => setPanel({ kind: "root" })}
                    aria-label="Nazad"
                    title="Nazad"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="text-[12px] mic-muted">Navigacija</div>
                  <div className="truncate text-[14px] font-semibold">{title}</div>
                </div>

                <button
                  type="button"
                  className="mic-btn h-10 w-10 p-0"
                  onClick={onClose}
                  aria-label="Zatvori"
                  title="Zatvori"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search */}
              <div className="px-3 pb-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="mic-input pl-9"
                    placeholder="Pretraži kategorije…"
                    aria-label="Pretraži kategorije"
                    autoFocus={false}
                  />
                </div>

                {/* quick links */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href={`${basePrefix}/`} className="mic-pill text-[12px]" onClick={onClose}>
                    Početna
                  </Link>
                  <Link href={`${basePrefix}/`} className="mic-pill text-[12px]" onClick={onClose}>
                    Najnovije
                  </Link>
                  <Link href={`${basePrefix}/`} className="mic-pill text-[12px]" onClick={onClose}>
                    Akcije
                  </Link>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="h-[calc(100vh-160px)] overflow-auto p-2">
              {q.isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-11 rounded-lg bg-black/5 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-3 text-sm mic-muted">Nema rezultata.</div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((c) => {
                    const hasChildren = (c.children?.length ?? 0) > 0;
                    const href = `${basePrefix}/${c.slug_path}`;
                    return (
                      <div key={c.id} className="rounded-lg border bg-white mic-border">
                        <div className="flex items-center">
                          <Link
                            href={href}
                            className="flex-1 px-3 py-3 text-[13px] font-medium"
                            onClick={onClose}
                          >
                            {c.name}
                          </Link>

                          {hasChildren ? (
                            <button
                              type="button"
                              className={cx("h-11 w-11 border-l mic-border hover:bg-black/5")}
                              onClick={() => setPanel({ kind: "node", id: c.id })}
                              aria-label="Otvori podkategorije"
                              title="Podkategorije"
                            >
                              <ChevronRight className="mx-auto h-5 w-5 text-black/60" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t bg-white p-3">
              <div className="grid grid-cols-2 gap-2">
                <Link href={`${basePrefix}/`} className="mic-btn justify-center" onClick={onClose}>
                  Katalog
                </Link>
                <Link href={`${basePrefix}/`} className="mic-btn-primary justify-center" onClick={onClose}>
                  Kontakt
                </Link>
              </div>

              <div className="mt-2 text-[11px] mic-muted">
                Drill-down meni • brz • bez MIC “haosa”
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
