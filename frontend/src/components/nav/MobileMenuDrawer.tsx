"use client";

import * as React from "react";
import Link from "next/link";
import { X, Menu } from "lucide-react";
import { useCategoryTree, type CategoryNode } from "@/hooks/useCategoryTree";

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

function flattenTop(items: CategoryNode[]) {
  return (items ?? []).slice(0, 30);
}

export function MobileMenuDrawer() {
  const q = useCategoryTree();
  const items = flattenTop(q.data?.items ?? []);

  const [open, setOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<number | null>(null);

  const active = React.useMemo(() => {
    if (!activeId) return items[0] ?? null;
    return items.find((x) => x.id === activeId) ?? items[0] ?? null;
  }, [items, activeId]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mic-btn h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label="Otvori meni"
        title="Meni"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button className="absolute inset-0 bg-black/35" onClick={() => setOpen(false)} aria-label="Zatvori meni" />

          <div className="absolute left-0 top-0 h-full w-[92vw] max-w-[420px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-[13px] font-semibold">Meni</div>
              <button className="mic-btn h-9 w-9" onClick={() => setOpen(false)} aria-label="Zatvori">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="px-4 py-3">
                <div className="text-[11px] mic-muted-2 uppercase tracking-wide">Kategorije</div>

                {q.isLoading ? (
                  <div className="mt-2 space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-black/5 animate-pulse" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="mt-2 text-[12px] mic-muted">Nema kategorija.</div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {items.map((c) => {
                      const isActive = active?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={cx(
                            "h-10 rounded-lg border px-3 text-left text-[12px] font-medium",
                            isActive ? "bg-black text-white border-black" : "bg-white hover:bg-black/5"
                          )}
                          onClick={() => setActiveId(c.id)}
                        >
                          <span className="block truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t px-4 py-3">
                <div className="text-[12px] font-semibold">{active?.name ?? "Podkategorije"}</div>

                {active?.children?.length ? (
                  <div className="mt-2 space-y-1">
                    {active.children.slice(0, 30).map((ch) => (
                      <Link
                        key={ch.id}
                        href={`/${ch.slug_path}`}
                        className="block rounded-md px-2 py-2 text-[12px] hover:bg-black/5"
                        onClick={() => setOpen(false)}
                      >
                        {ch.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-[12px] mic-muted">Nema podkategorija.</div>
                )}

                {active?.slug_path ? (
                  <Link
                    href={`/${active.slug_path}`}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md border bg-white px-3 py-2 text-[12px] font-medium hover:bg-black/5"
                    onClick={() => setOpen(false)}
                  >
                    Pogledaj sve u “{active.name}”
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="border-t px-4 py-3">
              <Link
                href="/"
                className="mic-btn-solid h-10 w-full"
                onClick={() => setOpen(false)}
              >
                Početna
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
