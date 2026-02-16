"use client";

import * as React from "react";
import { LayoutGrid, List, X } from "lucide-react";

import { useCategoryProducts, type Facet } from "@/hooks/useCategoryProducts";
import { useUrlFilters, type SortKey, type ViewMode } from "@/hooks/useUrlFilters";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { ProductCardGallery } from "@/components/catalog/ProductCardGallery";
import { ProductRowList } from "@/components/catalog/ProductRowList";
import { FacetBlock } from "@/components/catalog/FacetBlock";
import { MobileFiltersDrawer } from "@/components/catalog/MobileFiltersDrawer";

type Props = { slugPath: string };

const SORT_TABS: Array<{ key: SortKey; label: string; disabled?: boolean }> = [
  { key: "podrazumevano", label: "Relevantno" },
  { key: "najnovije", label: "Najnovije" },
  { key: "cena_gore", label: "Cena ↑" },
  { key: "cena_dole", label: "Cena ↓" },
];

const SORT_SELECT_ALL: Array<{ key: SortKey; label: string; disabled?: boolean }> = [
  { key: "podrazumevano", label: "Podrazumevano" },
  { key: "najnovije", label: "Najnovije" },
  { key: "cena_gore", label: "Cena: rastuće" },
  { key: "cena_dole", label: "Cena: opadajuće" },
  { key: "popularno", label: "Popularno", disabled: true },
  { key: "snizenje", label: "Sniženje", disabled: true },
  { key: "ocena", label: "Ocena", disabled: true },
];

const PER_PAGE_OPTIONS = [12, 24, 36, 48, 60] as const;

function formatRSD(n: number) {
  return new Intl.NumberFormat("sr-RS").format(Math.round(n)) + " RSD";
}

type ChipItem =
  | { kind: "facet"; code: "brand" | "size" | "color" | "material"; value: string; label: string }
  | { kind: "price"; label: string }
  | { kind: "sort"; label: string }
  | { kind: "view"; label: string }
  | { kind: "perPage"; label: string };

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="mic-pill">
      <span className="max-w-[220px] truncate">{label}</span>
      <button type="button" className="rounded-full p-0.5 hover:bg-black/10" onClick={onRemove} aria-label="Ukloni">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-md border bg-white p-1">
      <button
        type="button"
        onClick={() => onChange("galerija")}
        className={[
          "inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition",
          value === "galerija" ? "bg-black text-white" : "hover:bg-black/5",
        ].join(" ")}
        aria-pressed={value === "galerija"}
        title="Galerija"
      >
        <LayoutGrid className="h-4 w-4" />
        Grid
      </button>
      <button
        type="button"
        onClick={() => onChange("lista")}
        className={[
          "inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition",
          value === "lista" ? "bg-black text-white" : "hover:bg-black/5",
        ].join(" ")}
        aria-pressed={value === "lista"}
        title="Lista"
      >
        <List className="h-4 w-4" />
        List
      </button>
    </div>
  );
}

export default function CategoryListingClient({ slugPath }: Props) {
  const { filters, toggleMulti, removeMulti, setPriceDraft, setPrice, setSort, setPage, setPerPage, setView, resetAll } =
    useUrlFilters();

  const q = useCategoryProducts(slugPath, filters);
  const data = q.data;

  // --- price bounds from API ---
  const [bounds, setBounds] = React.useState<{ min: number; max: number } | null>(null);

  React.useEffect(() => {
    const minAvail = data?.meta?.price?.min_available ?? null;
    const maxAvail = data?.meta?.price?.max_available ?? null;

    if (minAvail == null || maxAvail == null || maxAvail < minAvail) return;

    setBounds((prev) => {
      if (!prev) return { min: minAvail, max: maxAvail };
      if (prev.min === minAvail && prev.max === maxAvail) return prev;
      return { min: minAvail, max: maxAvail };
    });
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
  }, [filters.min, filters.max, filters.page, filters.perPage, filters.sort, filters.view, slugPath]);

  const uiMin = draftPrice?.[0] ?? committedMin;
  const uiMax = draftPrice?.[1] ?? committedMax;

  const view: ViewMode = (filters.view ?? "galerija") as ViewMode;
  const perPage = filters.perPage ?? 24;

  const canReset =
    (filters.brand?.length ?? 0) > 0 ||
    (filters.size?.length ?? 0) > 0 ||
    (filters.color?.length ?? 0) > 0 ||
    (filters.material?.length ?? 0) > 0 ||
    filters.min != null ||
    filters.max != null ||
    (filters.sort ?? "podrazumevano") !== "podrazumevano" ||
    (filters.page ?? 1) !== 1 ||
    (filters.perPage ?? 24) !== 24 ||
    (filters.view ?? "galerija") !== "galerija";

  const activeCount =
    (filters.brand?.length ?? 0) +
    (filters.size?.length ?? 0) +
    (filters.color?.length ?? 0) +
    (filters.material?.length ?? 0) +
    (filters.min != null || filters.max != null ? 1 : 0) +
    ((filters.sort ?? "podrazumevano") !== "podrazumevano" ? 1 : 0) +
    ((filters.view ?? "galerija") !== "galerija" ? 1 : 0) +
    ((filters.perPage ?? 24) !== 24 ? 1 : 0);

  const chips: ChipItem[] = React.useMemo(() => {
    const out: ChipItem[] = [];

    const pushFacet = (code: "brand" | "size" | "color" | "material", values?: string[]) => {
      const facet = facetByCode.get(code);
      for (const v of values ?? []) {
        const optLabel = facet?.options.find((o) => o.value === v)?.label ?? v;
        const prefix = code === "brand" ? "Brend" : code === "size" ? "Veličina" : code === "color" ? "Boja" : "Materijal";
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
      const label = SORT_SELECT_ALL.find((x) => x.key === s)?.label ?? s;
      out.push({ kind: "sort", label: `Sort: ${label}` });
    }

    if ((filters.view ?? "galerija") !== "galerija") {
      out.push({ kind: "view", label: `Prikaz: ${(filters.view ?? "galerija") === "lista" ? "Lista" : "Galerija"}` });
    }

    if ((filters.perPage ?? 24) !== 24) {
      out.push({ kind: "perPage", label: `Po strani: ${filters.perPage}` });
    }

    return out;
  }, [filters, facetByCode, minAvail, maxAvail]);

  const removeChip = (c: ChipItem) => {
    if (c.kind === "price") return setPrice(null, null);
    if (c.kind === "sort") return setSort("podrazumevano");
    if (c.kind === "view") return setView("galerija");
    if (c.kind === "perPage") return setPerPage(24);
    if (c.kind === "facet") return removeMulti(c.code as any, c.value);
  };

  const orderedFacetCodes: Array<"brand" | "size" | "color" | "material"> = ["brand", "size", "color", "material"];
  const facetSections = orderedFacetCodes
    .map((code) => facetByCode.get(code))
    .filter((f): f is Facet => !!f && (f.options?.length ?? 0) > 0);

  const page = data?.pagination?.page ?? (filters.page ?? 1);
  const total = data?.pagination?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, perPage)));

  const onToggleFacet = (facetCode: string, value: string) => {
    toggleMulti(facetCode as any, value);
  };

  // shared filter content (sidebar + drawer)
  const FiltersContent = (
    <div className="flex flex-col gap-3">
      {/* Price */}
      <div className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold">Cena</div>
          <div className="text-[11px] mic-muted">
            {sliderReady ? `${formatRSD(uiMin)} – ${formatRSD(uiMax)}` : "…"}
          </div>
        </div>

        <div className="mt-2">
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
              // draft ne gura URL (brže)
              setPriceDraft(next[0], next[1]);
            }}
            onValueCommit={(v) => {
              if (!sliderReady) return;
              const next: [number, number] = [Math.min(v[0], v[1]), Math.max(v[0], v[1])];
              setDraftPrice(null);
              setPrice(next[0], next[1]);
            }}
            format={formatRSD}
          />

          {!sliderReady ? <div className="mt-2 text-[11px] mic-muted-2">Čekam opseg cene iz API-ja…</div> : null}
        </div>
      </div>

      {/* Facets */}
      <div className="flex flex-col gap-3">
        {facetSections.map((facet) => {
          const selectedArr = (filters[facet.code as any] as string[] | undefined) ?? [];
          const selected = new Set(selectedArr);

          return (
            <FacetBlock key={facet.code} facet={facet} selected={selected} onToggle={onToggleFacet} defaultVisible={6} />
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] mic-muted-2">{slugPath}</div>
          <h1 className="truncate text-xl font-semibold">{data?.category?.name ?? "Kategorija"}</h1>
          <div className="mt-1 text-[12px] mic-muted">
            {total} proizvoda • strana {page}/{pageCount}
            {q.isFetching ? <span className="ml-2 inline-block h-2 w-2 rounded-full bg-black/30 align-middle animate-pulse" /> : null}
          </div>
        </div>

        <button
          type="button"
          className="mic-btn h-9 px-3 text-[12px] disabled:opacity-50"
          onClick={resetAll}
          disabled={!canReset}
          title="Reset filtera"
        >
          Reset
        </button>
      </div>

{/* Mobile bottom bar (controls + chips) */}
<div className="mic-bottombar lg:hidden">
  <div className="mx-auto w-full max-w-6xl px-3 py-2">
    <div className="flex items-center justify-between gap-2">
      <MobileFiltersDrawer
        activeCount={activeCount}
        subtitle={
          <span>
            {total} proizvoda • {q.isFetching ? "osvežavam…" : "spremno"}
          </span>
        }
      >
        {FiltersContent}
      </MobileFiltersDrawer>

      <div className="flex items-center gap-2">
        <ViewToggle value={view} onChange={setView} />
        <select
          className="mic-select"
          value={filters.sort ?? "podrazumevano"}
          onChange={(e) => setSort(e.target.value as SortKey)}
          title="Sort"
        >
          {SORT_SELECT_ALL.map((opt) => (
            <option key={opt.key} value={opt.key} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="mt-2 flex items-center justify-between gap-2">
      <div className="text-[12px] mic-muted">Po strani</div>
      <select className="mic-select" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
        {PER_PAGE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>

    {/* chips (mobile) */}
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
{chips.length ? (
  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
    {chips.map((c) => (
      <Chip
        key={`${c.kind}:${"code" in c ? c.code : ""}:${"value" in c ? c.value : ""}:${c.label}`}
        label={c.label}
        onRemove={() => removeChip(c)}
      />
    ))}
  </div>
) : null}
    </div>
  </div>
</div>

{/* Spacer da bottom bar ne prekriva sadržaj (samo mobile) */}
<div className="h-[96px] lg:hidden" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block lg:sticky lg:top-3 lg:h-[calc(100vh-24px)] lg:overflow-auto">
          <div className="mic-card p-3">
            <div className="text-[13px] font-semibold">Filteri</div>
            <div className="mt-3">{FiltersContent}</div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex flex-col gap-3">
          {/* Active chips (desktop) */}
          <div className="hidden lg:flex flex-wrap items-center gap-2">
            {chips.length ? (
              chips.map((c) => (
                <Chip
                  key={`${c.kind}:${"code" in c ? c.code : ""}:${"value" in c ? c.value : ""}:${c.label}`}
                  label={c.label}
                  onRemove={() => removeChip(c)}
                />
              ))
            ) : (
              <div className="text-[12px] mic-muted">Nema aktivnih filtera.</div>
            )}
          </div>

          {/* Sort/controls bar (desktop) */}
          <div className="mic-card p-3 hidden lg:block">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[12px] font-semibold text-black/70">Sort:</div>

                <div className="flex flex-wrap gap-1.5">
                  {SORT_TABS.map((t) => {
                    const active = (filters.sort ?? "podrazumevano") === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        disabled={t.disabled}
                        onClick={() => setSort(t.key)}
                        className={[
                          "h-8 rounded-md border px-2.5 text-[12px] transition",
                          active ? "bg-black text-white border-black" : "bg-white hover:bg-black/5",
                          t.disabled ? "opacity-50 cursor-not-allowed" : "",
                        ].join(" ")}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                <select
                  className="mic-select ml-1"
                  value={filters.sort ?? "podrazumevano"}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  title="Detaljnije sortiranje"
                >
                  {SORT_SELECT_ALL.map((opt) => (
                    <option key={opt.key} value={opt.key} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ViewToggle value={view} onChange={setView} />

                <div className="flex items-center gap-2">
                  <div className="text-[12px] font-semibold text-black/70">Po strani</div>
                  <select className="mic-select" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                    {PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {q.error ? (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-[12px]">
                Greška: {(q.error as Error).message}
              </div>
            ) : null}
          </div>

          {/* Results */}
          <div className="mic-card p-3">
            {view === "galerija" ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {(data?.products ?? []).map((p) => (
                  <ProductCardGallery key={p.id} slugPath={slugPath} p={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {(data?.products ?? []).map((p) => (
                  <ProductRowList key={p.id} slugPath={slugPath} p={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                className="mic-btn h-9 px-3 text-[12px] disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Prethodna
              </button>

              <div className="text-[12px] mic-muted">
                Strana {page} / {pageCount}
              </div>

              <button
                type="button"
                className="mic-btn h-9 px-3 text-[12px] disabled:opacity-50"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                Sledeća
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
