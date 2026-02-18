"use client";

import * as React from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { Facet, FacetOption } from "@/hooks/useCategoryProducts";

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function stableSortOptions(opts: FacetOption[], selected: Set<string>) {
  return [...opts].sort((a, b) => {
    const aSel = selected.has(a.value) ? 1 : 0;
    const bSel = selected.has(b.value) ? 1 : 0;
    if (aSel !== bSel) return bSel - aSel;

    const ac = a.count ?? 0;
    const bc = b.count ?? 0;
    if (ac !== bc) return bc - ac;

    const al = norm(a.label ?? a.value ?? "");
    const bl = norm(b.label ?? b.value ?? "");
    if (al < bl) return -1;
    if (al > bl) return 1;
    return 0;
  });
}

export function FacetBlock({
  facet,
  selected,
  onToggle,
  onClearFacet,
  defaultVisible = 6,
  searchThreshold = 12,
}: {
  facet: Facet;
  selected: Set<string>;
  onToggle: (facetCode: string, value: string) => void;
  onClearFacet?: (facetCode: string) => void;
  defaultVisible?: number;
  searchThreshold?: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [onlySelected, setOnlySelected] = React.useState(false);

  React.useEffect(() => {
    setExpanded(false);
    setQ("");
    setOnlySelected(false);
  }, [facet.code]);

  const opts = facet.options ?? [];
  const selectedCount = selected?.size ?? 0;

  const canExpand = opts.length > defaultVisible;
  const canSearch = opts.length >= searchThreshold;

  const qn = React.useMemo(() => norm(q), [q]);
  const ordered = React.useMemo(
    () => stableSortOptions(opts, selected ?? new Set<string>()),
    [opts, selected]
  );

  const filtered = React.useMemo(() => {
    const base = ordered;

    if (onlySelected) return base.filter((o) => selected.has(o.value));
    if (!qn) return base;

    const matched = base.filter((o) => norm(o.label ?? o.value ?? "").includes(qn));
    const selectedNotMatched = base.filter((o) => selected.has(o.value) && !matched.some((m) => m.value === o.value));

    return [...selectedNotMatched, ...matched];
  }, [ordered, qn, selected, onlySelected]);

  const visible = React.useMemo(() => {
    if (qn || onlySelected) return filtered;
    return expanded ? filtered : filtered.slice(0, defaultVisible);
  }, [qn, filtered, expanded, defaultVisible, onlySelected]);

  const clearFacet = React.useCallback(() => {
    if (!selected || selected.size === 0) return;
    if (onClearFacet) {
      onClearFacet(facet.code);
      return;
    }
    for (const v of Array.from(selected)) onToggle(facet.code, v);
  }, [selected, onToggle, onClearFacet, facet.code]);

  const title = selectedCount > 0 ? `${facet.label} (${selectedCount})` : facet.label;

  return (
    <div className="border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: "rgb(var(--border))" }}>
      {/* header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="mic-facet-title truncate">{title}</div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 ? (
            <button
              type="button"
              className="mic-btn h-8 px-2 text-[11px]"
              onClick={clearFacet}
              title={`Poništi izabrano: ${facet.label}`}
              aria-label={`Poništi izabrano: ${facet.label}`}
            >
              <X className="h-3.5 w-3.5" />
              Poništi
            </button>
          ) : null}

          {canExpand && !qn && !onlySelected ? (
            <button
              type="button"
              className="mic-btn h-8 px-2 text-[11px]"
              onClick={() => setExpanded((x) => !x)}
              aria-expanded={expanded}
              title={expanded ? "Prikaži manje" : "Prikaži još"}
            >
              {expanded ? "Manje" : "Prikaži još"}
              <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`} />
            </button>
          ) : null}
        </div>
      </div>

      {/* search + onlySelected */}
      {(canSearch || selectedCount > 0) ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          {canSearch ? (
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <input
                className="mic-input h-8 pl-8 pr-10"
                placeholder="Pretraži…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={`Pretraga: ${facet.label}`}
              />
              {q ? (
                <button
                  type="button"
                  className="mic-btn absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                  onClick={() => setQ("")}
                  title="Poništi pretragu"
                  aria-label="Poništi pretragu"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ) : (
            <div />
          )}

          {selectedCount > 0 ? (
            <button
              type="button"
              className={[
                "h-8 px-2 text-[11px]",
                onlySelected ? "rounded-[6px] bg-black text-white border-transparent" : "mic-btn",
              ].join(" ")}
              onClick={() => setOnlySelected((x) => !x)}
              title={onlySelected ? "Prikaži sve opcije" : "Prikaži samo izabrane opcije"}
              aria-pressed={onlySelected}
            >
              {onlySelected ? "Prikaži sve" : "Prikaži samo izabrano"}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* options */}
      <div className="mt-2 flex flex-col gap-1">
        {visible.length === 0 ? <div className="mic-empty">Nema rezultata.</div> : null}

        {visible.map((opt: FacetOption) => {
          const count = opt.count ?? 0;
          const disabled = count <= 0;
          const checked = selected.has(opt.value);
          const label = opt.label ?? opt.value;

          return (
            <label
              key={`${facet.code}:${opt.value}`}
              className={[
                "mic-facet-option",
                disabled ? "mic-facet-option-disabled" : "cursor-pointer",
                checked ? "bg-black/[0.03]" : "",
              ].join(" ")}
              title={disabled ? "Nema dostupnih proizvoda za ovu opciju" : label}
            >
              <span className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  className="mic-checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(facet.code, opt.value)}
                />
                <span className="truncate">{label}</span>
              </span>

              {/* centered count */}
              <span className="mic-facet-count min-w-[2.5rem] text-center tabular-nums">{count}</span>
            </label>
          );
        })}
      </div>

      {!qn && !onlySelected && canExpand && !expanded ? (
        <div className="mt-1 text-[11px] mic-muted-2">
          Prikazano {Math.min(defaultVisible, filtered.length)} od {filtered.length}
        </div>
      ) : null}

      {qn ? <div className="mt-1 text-[11px] mic-muted-2">Rezultata: {filtered.length}</div> : null}
    </div>
  );
}
