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

const nfSR = new Intl.NumberFormat("sr-RS");

function formatRSD(n: number) {
  return nfSR.format(Math.round(n)) + " RSD";
}

function formatRSDRange(lo: number, hi: number) {
  const a = nfSR.format(Math.round(lo));
  const b = nfSR.format(Math.round(hi));
  return `${a} – ${b} RSD`;
}

type ChipItem =
  | { kind: "facet"; code: string; value: string; label: string }
  | { kind: "price"; label: string }
  | { kind: "sort"; label: string }
  | { kind: "view"; label: string }
  | { kind: "perPage"; label: string };

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="mic-chip-compact">
      <span className="mic-chip-dot" aria-hidden="true" />
      <span className="max-w-[220px] truncate">{label}</span>
      <button
        type="button"
        className="rounded-full p-0.5 hover:bg-black/10"
        onClick={onRemove}
        aria-label="Ukloni"
        title="Ukloni"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const isGrid = value === "galerija";
  const isList = value === "lista";

  return (
    <div className="inline-flex rounded-md bg-black/[0.03] p-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange("galerija")}
          className={[
            "inline-flex items-center gap-2 px-2.5 py-1.5 text-[12px] transition",
            "border",
            isGrid
              ? "rounded-[6px] bg-black text-white border-transparent"
              : "rounded-md bg-white text-black/80 border-[rgb(var(--border))] hover:bg-black/5",
          ].join(" ")}
          aria-pressed={isGrid}
          title="Grid prikaz"
        >
          <LayoutGrid className="h-4 w-4" />
          Grid
        </button>

        <button
          type="button"
          onClick={() => onChange("lista")}
          className={[
            "inline-flex items-center gap-2 px-2.5 py-1.5 text-[12px] transition",
            "border",
            isList
              ? "rounded-[6px] bg-black text-white border-transparent"
              : "rounded-md bg-white text-black/80 border-[rgb(var(--border))] hover:bg-black/5",
          ].join(" ")}
          aria-pressed={isList}
          title="List prikaz"
        >
          <List className="h-4 w-4" />
          List
        </button>
      </div>
    </div>
  );
}

export default function CategoryListingClient({ slugPath }: Props) {
  const {
    filters,
    toggleMulti,
    removeMulti,
    clearMulti,
    setPriceDraft,
    setPrice,
    setSort,
    setPage,
    setPerPage,
    setView,
    resetAll,
  } = useUrlFilters();

  const q = useCategoryProducts(slugPath, filters);
  const data = q.data;

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

  // ✅ show "—" until API arrives, not 0
  const totalMaybe = data?.meta?.total;
  const totalLabel = totalMaybe == null ? "—" : String(totalMaybe);

  const total = data?.meta?.total ?? 0;
  const page = filters.page ?? 1;
  const pageCount = data?.meta?.page_count ?? 1;

  const perPage = filters.perPage ?? 24;
  const view = (filters.view ?? "galerija") as ViewMode;

  const facetSections = React.useMemo(() => {
    const knownOrder = ["brand", "size", "color", "material"];
    const byKnown = knownOrder.map((code) => facetByCode.get(code)).filter(Boolean) as Facet[];
    const rest = facets.filter((f) => !knownOrder.includes(f.code));
    return [...byKnown, ...rest];
  }, [facetByCode, facets]);

  const chips: ChipItem[] = React.useMemo(() => {
    const out: ChipItem[] = [];

    for (const facet of facetSections) {
      const code = facet.code;

      let selectedArr: string[] = [];
      if (code === "brand") selectedArr = filters.brand ?? [];
      else if (code === "size") selectedArr = filters.size ?? [];
      else if (code === "color") selectedArr = filters.color ?? [];
      else if (code === "material") selectedArr = filters.material ?? [];
      else selectedArr = filters.facets?.[code] ?? [];

      if (!selectedArr.length) continue;

      for (const value of selectedArr) {
        const opt = facet.options?.find((o) => o.value === value);
        const vLabel = opt?.label ?? value;
        out.push({ kind: "facet", code, value, label: `${facet.label}: ${vLabel}` });
      }
    }

    if (filters.min != null || filters.max != null) {
      const minV = filters.min ?? bounds?.min ?? 0;
      const maxV = filters.max ?? bounds?.max ?? 0;
      out.push({ kind: "price", label: `Cena: ${formatRSDRange(minV, maxV)}` });
    }

    if ((filters.sort ?? "podrazumevano") !== "podrazumevano") {
      const label = SORT_SELECT_ALL.find((x) => x.key === (filters.sort ?? "podrazumevano"))?.label ?? "Sort";
      out.push({ kind: "sort", label: `Sort: ${label}` });
    }

    if (view !== "galerija") out.push({ kind: "view", label: "Prikaz: Lista" });
    if (perPage !== 24) out.push({ kind: "perPage", label: `Po strani: ${perPage}` });

    return out;
  }, [facetSections, filters, bounds, view, perPage]);

  const activeCount = React.useMemo(() => {
    let c = 0;

    c += filters.brand?.length ?? 0;
    c += filters.size?.length ?? 0;
    c += filters.color?.length ?? 0;
    c += filters.material?.length ?? 0;

    if (filters.facets) {
      for (const arr of Object.values(filters.facets)) c += Array.isArray(arr) ? arr.length : 0;
    }

    if (filters.min != null || filters.max != null) c += 1;
    return c;
  }, [filters]);

  const canReset =
    activeCount > 0 || (filters.sort ?? "podrazumevano") !== "podrazumevano" || view !== "galerija" || perPage !== 24;

  function removeChip(c: ChipItem) {
    if (c.kind === "facet") return removeMulti(c.code, c.value);
    if (c.kind === "price") return setPrice(null, null);
    if (c.kind === "sort") return setSort("podrazumevano");
    if (c.kind === "view") return setView("galerija");
    if (c.kind === "perPage") return setPerPage(24);
  }

  function onToggleFacet(code: string, value: string) {
    toggleMulti(code, value);
  }

  const [draftPrice, setDraftPrice] = React.useState<[number, number] | null>(null);

  React.useEffect(() => {
    setDraftPrice(null);
  }, [filters.min, filters.max]);

  const uiMin = draftPrice?.[0] ?? filters.min ?? bounds?.min ?? 0;
  const uiMax = draftPrice?.[1] ?? filters.max ?? bounds?.max ?? 0;

  const [sliderReadyOnce, setSliderReadyOnce] = React.useState(false);
  React.useEffect(() => {
    if (!!bounds && !sliderReadyOnce) setSliderReadyOnce(true);
  }, [bounds, sliderReadyOnce]);

  const FiltersContent = (
    <div className="flex flex-col gap-4">
      <div className="mic-card p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold">Cena</div>
            <div className="mt-1 text-[12px] mic-muted whitespace-nowrap tabular-nums">
              {formatRSDRange(Math.min(uiMin, uiMax), Math.max(uiMin, uiMax))}
            </div>
          </div>

          <button
            type="button"
            className="mic-btn h-8 w-8 p-0 disabled:opacity-50"
            onClick={() => setPrice(null, null)}
            disabled={filters.min == null && filters.max == null}
            aria-label="Poništi raspon cene"
            title="Poništi raspon cene"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3">
          <RangeSlider
            disabled={!sliderReadyOnce}
            min={bounds?.min ?? 0}
            max={bounds?.max ?? 0}
            value={[Math.min(uiMin, uiMax), Math.max(uiMin, uiMax)]}
            onValueChange={(v) => {
              if (!sliderReadyOnce) return;
              const next: [number, number] = [Math.min(v[0], v[1]), Math.max(v[0], v[1])];
              setDraftPrice(next);
              setPriceDraft(next[0], next[1]);
            }}
            onValueCommit={(v) => {
              if (!sliderReadyOnce) return;
              const next: [number, number] = [Math.min(v[0], v[1]), Math.max(v[0], v[1])];
              setDraftPrice(null);
              setPrice(next[0], next[1]);
            }}
            format={formatRSD}
          />

          {!bounds ? <div className="mt-2 text-[11px] mic-muted-2">Čekam opseg cene iz API-ja…</div> : null}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {facetSections.map((facet) => {
          let selectedArr: string[] = [];
          if (facet.code === "brand") selectedArr = filters.brand ?? [];
          else if (facet.code === "size") selectedArr = filters.size ?? [];
          else if (facet.code === "color") selectedArr = filters.color ?? [];
          else if (facet.code === "material") selectedArr = filters.material ?? [];
          else selectedArr = filters.facets?.[facet.code] ?? [];

          const selected = new Set(selectedArr);

          return (
            <FacetBlock
              key={facet.code}
              facet={facet}
              selected={selected}
              onToggle={onToggleFacet}
              onClearFacet={(code) => clearMulti(code)}
              defaultVisible={6}
            />
          );
        })}
      </div>
    </div>
  );

  // ✅ desktop-like indicator: only when fetching
  const mobileSubtitle = (
    <span className="inline-flex items-center gap-2">
      <span className="tabular-nums">{totalLabel} proizvoda</span>
      {q.isFetching ? <span className="inline-block h-2 w-2 rounded-full bg-black/30 animate-pulse" /> : null}
    </span>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] mic-muted-2">{slugPath}</div>
          <h1 className="truncate text-xl font-semibold">{data?.category?.name ?? "Kategorija"}</h1>
          <div className="mt-1 text-[12px] mic-muted">
            {total} proizvoda • strana {page}/{pageCount}
            {q.isFetching ? (
              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-black/30 align-middle animate-pulse" />
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className={[canReset ? "mic-btn-primary" : "mic-btn", "h-9 px-3 text-[12px] disabled:opacity-50"].join(" ")}
          onClick={resetAll}
          disabled={!canReset}
          title="Poništi filtere"
        >
          Poništi filtere
        </button>
      </div>

      <div className="lg:hidden mb-3">
        <div className="mic-card p-2">
          <div className="flex items-center justify-between gap-2">
            <MobileFiltersDrawer
              activeCount={activeCount}
              subtitle={mobileSubtitle}
              canReset={canReset}
              onReset={resetAll}
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="mic-card p-3">
            <div className="text-[13px] font-semibold">Filteri</div>
            <div className="mt-3">{FiltersContent}</div>
          </div>
        </aside>

        <main className="flex flex-col gap-3">
          {chips.length ? (
            <div className="lg:hidden">
              <div className="mic-card p-2">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {chips.map((c) => (
                    <Chip
                      key={`${c.kind}:${"code" in c ? c.code : ""}:${"value" in c ? c.value : ""}:${c.label}`}
                      label={c.label}
                      onRemove={() => removeChip(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="hidden lg:block">
            <div className="mic-card p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-[12px] font-semibold text-black/70">Sort:</div>

                  <div className="flex flex-wrap gap-2">
                    {SORT_TABS.map((t) => {
                      const activeTab = (filters.sort ?? "podrazumevano") === t.key;

                      return (
                        <button
                          key={t.key}
                          type="button"
                          disabled={t.disabled}
                          onClick={() => setSort(t.key)}
                          className={[
                            "h-8 px-2.5 text-[12px] transition border",
                            activeTab
                              ? "rounded-[6px] bg-black text-white border-transparent"
                              : "rounded-md bg-white text-black/80 border-[rgb(var(--border))] hover:bg-black/5 hover:border-[rgb(var(--border-strong))]",
                            t.disabled ? "opacity-50 cursor-not-allowed" : "",
                          ].join(" ")}
                          title={`Sort: ${t.label}`}
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

              <div className="mt-3 border-t pt-3" style={{ borderColor: "rgb(var(--border))" }}>
                {chips.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {chips.map((c) => (
                      <Chip
                        key={`${c.kind}:${"code" in c ? c.code : ""}:${"value" in c ? c.value : ""}:${c.label}`}
                        label={c.label}
                        onRemove={() => removeChip(c)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-[12px] mic-muted">Nema aktivnih filtera.</div>
                )}
              </div>

              {q.error ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-[12px]">
                  Greška: {(q.error as Error).message}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mic-card p-3">
            {view === "galerija" ? (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
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
