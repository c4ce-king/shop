"use client";

import * as React from "react";
import Link from "next/link";
import { X, ChevronDown, Search } from "lucide-react";
import { useCategoryTree, type CategoryNode } from "@/hooks/useCategoryTree";

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

function topItems(items: CategoryNode[]) {
  return (items ?? []).slice(0, 40);
}

export function MobileMenu({
  open,
  onClose,
  basePrefix = "",
}: {
  open: boolean;
  onClose: () => void;
  basePrefix?: string;
}) {
  const q = useCategoryTree();
  const items = q.data?.items ?? [];
  const top = React.useMemo(() => topItems(items), [items]);

  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());
  const [qText, setQText] = React.useState("");

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
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) {
      setExpanded(new Set());
      setQText("");
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const needle = qText.trim().toLowerCase();
    if (!needle) return top;

    // simple filter by name (only top level)
    return top.filter((c) => (c.name ?? "").toLowerCase().includes(needle));
  }, [top, qText]);

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button className="mic-overlay" onClick={onClose} aria-label="Zatvori meni" />

      <div className="mic-drawer mic-drawer-left">
        <div className="mic-drawer-header">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold">Meni</div>
            <div className="mt-0.5 text-[11px] mic-muted">Kategorije + brza pretraga</div>
          </div>

          <button type="button" className="mic-btn h-9 w-9 p-0" onClick={onClose} aria-label="Zatvori" title="Zatvori">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b px-4 py-3" style={{ borderColor: "rgb(var(--border))" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <input
              className="mic-input pl-9"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Nađi kategoriju…"
              aria-label="Pretraga kategorija"
            />
          </div>

          <div className="mt-2 flex gap-2">
            <Link href={basePrefix || "/"} className="mic-btn h-9 flex-1" onClick={onClose}>
              Početna
            </Link>
            <Link href={(basePrefix ? "" : "/b2b") || "/b2b"} className="mic-btn h-9 flex-1" onClick={onClose}>
              B2B zona
            </Link>
          </div>
        </div>

        {/* Categories list (scrollable) */}
        <div className="flex-1 overflow-auto px-2 py-2">
          {q.isLoading ? (
            <div className="space-y-2 px-2 py-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-black/5 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-3 text-[12px] mic-muted">Nema rezultata.</div>
          ) : (
            <div className="space-y-1">
              {filtered.map((c) => {
                const isOpen = expanded.has(c.id);
                const hasChildren = !!c.children?.length;

                return (
                  <div key={c.id} className="rounded-lg border bg-white" style={{ borderColor: "rgb(var(--border))" }}>
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <Link
                        href={`${basePrefix}/${(c.slug_path ?? "").replace(/^\/+/, "")}`.replace(/\/\/+/, "/") || "#"}
                        className="min-w-0 flex-1 truncate text-[13px] font-medium"
                        onClick={onClose}
                      >
                        {c.name}
                      </Link>

                      {hasChildren ? (
                        <button
                          type="button"
                          className={cx("mic-btn h-8 w-8 p-0", isOpen && "bg-black/5")}
                          onClick={() => toggle(c.id)}
                          aria-label={isOpen ? "Sakrij podkategorije" : "Prikaži podkategorije"}
                          title={isOpen ? "Sakrij" : "Prikaži"}
                        >
                          <ChevronDown className={cx("h-4 w-4 transition", isOpen && "rotate-180")} />
                        </button>
                      ) : null}
                    </div>

                    {hasChildren && isOpen ? (
                      <div className="border-t px-3 py-2" style={{ borderColor: "rgb(var(--border))" }}>
                        <div className="grid grid-cols-1 gap-1">
                          {c.children!.slice(0, 24).map((ch) => (
                            <Link
                              key={ch.id}
                              href={`${basePrefix}/${(ch.slug_path ?? "").replace(/^\/+/, "")}`.replace(/\/\/+/, "/") || "#"}
                              className="rounded-md px-2 py-2 text-[12px] hover:bg-black/5"
                              onClick={onClose}
                            >
                              {ch.name}
                            </Link>
                          ))}
                        </div>

                        <Link
                          href={`${basePrefix}/${(c.slug_path ?? "").replace(/^\/+/, "")}`.replace(/\/\/+/, "/") || "#"}
                          className="mt-2 inline-flex w-full items-center justify-center rounded-md border bg-white px-3 py-2 text-[12px] font-medium hover:bg-black/5"
                          style={{ borderColor: "rgb(var(--border))" }}
                          onClick={onClose}
                        >
                          Pogledaj sve u “{c.name}”
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3" style={{ borderColor: "rgb(var(--border))" }}>
          <button type="button" className="mic-btn-solid h-10 w-full" onClick={onClose}>
            Zatvori
          </button>
          <div className="mt-2 text-center text-[11px] mic-muted">ESC / tap na pozadinu</div>
        </div>
      </div>
    </div>
  );
}
