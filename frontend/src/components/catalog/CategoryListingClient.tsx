"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";

import { useCategoryProducts, type Facet, type FacetOption } from "@/hooks/useCategoryProducts";
import { useUrlFilters, type SortKey } from "@/hooks/useUrlFilters";
import { RangeSlider } from "@/components/ui/RangeSlider";

type Props = { slugPath: string };

const SORT_OPTIONS: Array<{ key: SortKey; label: string; disabled?: boolean }> = [
  { key: "podrazumevano", label: "Podrazumevano" },
  { key: "najnovije", label: "Najnovije" },
  { key: "cena_gore", label: "Cena: rastuće" },
  { key: "cena_dole", label: "Cena: opadajuće" },
  { key: "popularno", label: "Popularno", disabled: true },
  { key: "snizenje", label: "Sniženje", disabled: true },
  { key: "ocena", label: "Ocena", disabled: true },
];

function formatRSD(n: number) {
  return new Intl.NumberFormat("sr-RS").format(Math.round(n)) + " RSD";
}

type ChipItem =
  | { kind: "facet"; code: "brand" | "size" | "color" | "material"; value: string; label: string }
  | { kind: "price"; label: string }
  | { kind: "sort"; label: string };

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs hover:bg-black/5">
      <span>{label}</span>
      <button type="button" className="rounded-full p-0.5 hover:bg-black/10" onClick={onRemove} aria-label="Ukloni">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function Collapsible({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-2xl border bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="text-sm font-semibold">{title}</div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

export default function CategoryListingClient({ slugPath }: Props) {
  const { filters, toggleMulti, removeMulti, setPriceDraft, setPrice, setSort, setPage, resetAll } = useUrlFilters();
  const q = useCategoryProducts(slugPath, filters);
  const data = q.data;

  const [bounds, setBounds] = React.useState<{ min: number; max: number } | null>(null);

  React.useEffect(() => {
    const minAvail = data?.meta?.price?.min_available ?? null;
    const maxAvail = data?.meta?.price?.max_available ?? null;
    if (minAvail != null && maxAvail != null && maxAvail >= minAvail) {
      setBounds({ min: minAvail, max: maxAvail });
    }
  }, [data?.meta?.price?.min_available, data?.meta?.price?.max_available]);

  const facets = data?.facets ?? [];
  const facetByCode = React.useMemo(() => {
    const m = new Map<string, Facet>();
    for (const f of facets) m.set(f.code, f);
    return m;
  }, [facets]);

  const sliderReady = bounds != null;
  const minAvail = bounds?.min ?? 0;
  const maxAvail = bounds?.max ?? 0;

  const committedMin = filters.min ?? (sliderReady ? minAvail : 0);
  const committedMax = filters.max ?? (sliderReady ? maxAvail : 0);

  const [draftPrice, setDraftPrice] = React.useState<[number, number] | null>(null);

  React.useEffect(() => {
    setDraftPrice(null);
  }, [filters.min, filters.max, slugPath]);

  const uiMin = draftPrice?.[0] ?? committedMin;
  const uiMax = draftPrice?.[1] ?? committedMax;

  const canReset =
    (filters.brand?.length ?? 0) > 0 ||
    (filters.size?.length ?? 0) > 0 ||
    (filters.color?.length ?? 0) > 0 ||
    (filters.material?.length ?? 0) > 0 ||
    filters.min != null ||
    filters.max != null ||
    (filters.sort ?? "podrazumevano") !== "podrazumevano" ||
    (filters.page ?? 1) !== 1;

  const chips: ChipItem[] = React.useMemo(() => {
    const out: ChipItem[] = [];

    const pushFacet = (code: "brand" | "size" | "color" | "material", values?: string[]) => {
      const facet = facetByCode.get(code);
      for (const v of values ?? []) {
        const optLabel = facet?.options.find((o) => o.value === v)?.label ?? v;
        const prefix =
          code === "brand" ? "Brend" : code === "size" ? "Veličina" : code === "color" ? "Boja" : "Materijal";
        out.push({ kind: "facet", code, value: v, label: `${prefix}: ${optLabel}` });
      }
    };

    pushFacet("brand", filters.brand);
    pushFacet("size", filters.size);
    pushFacet("color", filters.color);
    pushFacet("material", filters.material);

    if (filters.min != null || filters.max != null) {
      out.push({
        kind: "price",
        label: `Cena: ${formatRSD(filters.min ?? minAvail)} – ${formatRSD(filters.max ?? maxAvail)}`,
      });
    }

    if ((filters.sort ?? "podrazumevano") !== "podrazumevano") {
      const s = filters.sort ?? "podrazumevano";
      const label = SORT_OPTIONS.find((x) => x.key === s)?.label ?? s;
      out.push({ kind: "sort", label: `Sort: ${label}` });
    }

    return out;
  }, [filters, facetByCode, minAvail, maxAvail]);

  const removeChip = (c: ChipItem) => {
    if (c.kind === "price") return setPrice(null, null);
    if (c.kind === "sort") return setSort("podrazumevano");
    if (c.kind === "facet") return removeMulti(c.code as any, c.value);
  };

  const orderedFacetCodes: Array<"brand" | "size" | "color" | "material"> = ["brand", "size", "color", "material"];
  const facetSections = orderedFacetCodes
    .map((code) => facetByCode.get(code))
    .filter((f): f is Facet => !!f && (f.options?.length ?? 0) > 0);

  const page = data?.pagination?.page ?? (filters.page ?? 1);
  const perPage = data?.pagination?.per_page ?? 24;
  const total = data?.pagination?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, perPage)));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">Filteri</div>
            <button
              type="button"
              className="h-9 rounded-full border bg-white px-3 text-sm hover:bg-black/5 disabled:opacity-50"
              onClick={resetAll}
              disabled={!canReset}
            >
              Reset
            </button>
          </div>

          {/* CENA — ne collapsible, i guramo SVE ispod nje na dole */}
          <div className="rounded-2xl border bg-white px-4 py-3">
            <div className="text-sm font-semibold">Cena</div>

            <div className="mt-3">
              <RangeSlider
                min={sliderReady ? minAvail : 0}
                max={sliderReady ? maxAvail : 0}
                step={10}
                disabled={!sliderReady}
                value={[Math.min(uiMin, uiMax), Math.max(uiMin, uiMax)]}
                onValueChange={(v) => {
                  if (!sliderReady) return;
                  const next: [number, number] = [Math.min(v[0], v[1]), Math.max(v[0], v[1])];
                  setDraftPrice(next);
                  setPriceDraft(next[0], next[1]); // bez URL dok vučeš
                }}
                onValueCommit={(v) => {
                  if (!sliderReady) return;
                  const next: [number, number] = [Math.min(v[0], v[1]), Math.max(v[0], v[1])];
                  setDraftPrice(null);
                  setPrice(next[0], next[1]); // URL + refetch tek na puštanje
                }}
                format={formatRSD}
              />

              {!sliderReady ? <div className="mt-2 text-xs text-black/50">Čekam opseg cene iz API-ja…</div> : null}
            </div>
          </div>

          {/* ✅ OVO je ključno: “spacer” koji pomera Brend i ostale nadole */}
          <div className="h-10" />

          {facetSections.map((facet) => {
            const selectedArr = (filters[facet.code as any] as string[] | undefined) ?? [];
            const selected = new Set(selectedArr);

            return (
              <Collapsible key={facet.code} title={facet.label} defaultOpen={true}>
                <div className="flex flex-col gap-2">
                  {facet.options.map((opt: FacetOption) => {
                    const disabled = (opt.count ?? 0) <= 0;
                    const checked = selected.has(opt.value);

                    return (
                      <label
                        key={`${facet.code}:${opt.value}`}
                        className={`flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-sm ${
                          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-black/5"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleMulti(facet.code as any, opt.value)}
                          />
                          <span>{opt.label ?? opt.value}</span>
                        </span>
                        <span className="text-xs text-black/50">{opt.count}</span>
                      </label>
                    );
                  })}
                </div>
              </Collapsible>
            );
          })}
        </aside>

        <main className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {chips.length ? (
              chips.map((c) => (
                <Chip
                  key={`${c.kind}:${"code" in c ? c.code : ""}:${"value" in c ? c.value : ""}:${c.label}`}
                  label={c.label}
                  onRemove={() => removeChip(c)}
                />
              ))
            ) : (
              <div className="text-sm text-black/60">Nema aktivnih filtera.</div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-black/60">{q.isLoading ? "Učitavanje…" : `Ukupno: ${total} proizvoda`}</div>

              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">Sort</div>
                <select
                  className="h-9 rounded-full border bg-white px-3 text-sm"
                  value={filters.sort ?? "podrazumevano"}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="my-4 h-px w-full bg-black/10" />

            {q.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
                Greška: {(q.error as Error).message}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {(data?.products ?? []).map((p) => (
                    <div key={p.id} className="rounded-2xl border bg-white p-3 hover:shadow-sm">
                      <div className="aspect-square w-full overflow-hidden rounded-xl bg-black/5">
                        {p.image_grid_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_grid_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-col gap-1">
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="mt-1 text-sm font-bold">{formatRSD(p.price_rsd)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    className="h-9 rounded-full border bg-white px-3 text-sm hover:bg-black/5 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Prethodna
                  </button>

                  <div className="text-sm text-black/60">
                    Strana {page} / {pageCount}
                  </div>

                  <button
                    type="button"
                    className="h-9 rounded-full border bg-white px-3 text-sm hover:bg-black/5 disabled:opacity-50"
                    disabled={page >= pageCount}
                    onClick={() => setPage(page + 1)}
                  >
                    Sledeća
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
