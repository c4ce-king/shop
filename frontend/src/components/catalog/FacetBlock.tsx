"use client";

import * as React from "react";
import type { Facet, FacetOption } from "@/hooks/useCategoryProducts";

export function FacetBlock({
  facet,
  selected,
  onToggle,
  defaultVisible = 6,
}: {
  facet: Facet;
  selected: Set<string>;
  onToggle: (facetCode: string, value: string) => void;
  defaultVisible?: number;
}) {
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    // reset expand if facet changes
    setExpanded(false);
  }, [facet.code]);

  const opts = facet.options ?? [];
  const visible = expanded ? opts : opts.slice(0, defaultVisible);
  const canExpand = opts.length > defaultVisible;

  return (
    <div className="border-b pb-3 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-semibold">{facet.label}</div>
        {canExpand ? (
          <button
            type="button"
            className="text-xs text-black/60 hover:text-black"
            onClick={() => setExpanded((x) => !x)}
          >
            {expanded ? "Manje" : "Prikaži još"}
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {visible.map((opt: FacetOption) => {
          const disabled = (opt.count ?? 0) <= 0;
          const checked = selected.has(opt.value);

          return (
            <label
              key={`${facet.code}:${opt.value}`}
              className={[
                "flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[13px]",
                disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-black/5",
              ].join(" ")}
            >
              <span className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(facet.code, opt.value)}
                />
                <span className="truncate">{opt.label ?? opt.value}</span>
              </span>
              <span className="shrink-0 text-[11px] text-black/50">{opt.count}</span>
            </label>
          );
        })}
      </div>

      {canExpand && !expanded ? (
        <div className="mt-1 text-[11px] text-black/45">
          Prikazano {Math.min(defaultVisible, opts.length)} od {opts.length}
        </div>
      ) : null}
    </div>
  );
}
