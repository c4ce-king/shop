"use client";

import * as React from "react";

type RangeSliderProps = {
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;

  value: [number, number];
  onValueChange: (v: [number, number]) => void;
  onValueCommit?: (v: [number, number]) => void;

  /**
   * Tooltip: prikazi na hover + dok se vuce
   * (kasnije lako zamenis fancy tooltipom)
   */
  format?: (n: number) => string;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function snap(n: number, step: number) {
  if (step <= 0) return n;
  return Math.round(n / step) * step;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  disabled,
  value,
  onValueChange,
  onValueCommit,
  format,
}: RangeSliderProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const [hovered, setHovered] = React.useState(false);
  const [active, setActive] = React.useState<"min" | "max" | null>(null);

  // track which pointer started the drag (important for touch/multi-pointer)
  const activePointerIdRef = React.useRef<number | null>(null);

  const fmt = React.useCallback((n: number) => (format ? format(n) : String(Math.round(n))), [format]);

  const loSafe = clamp(value[0], min, max);
  const hiSafe = clamp(value[1], min, max);
  const low = Math.min(loSafe, hiSafe);
  const high = Math.max(loSafe, hiSafe);

  const range = max - min || 1;
  const lowPct = ((low - min) / range) * 100;
  const highPct = ((high - min) / range) * 100;

  const showTooltips = hovered || active !== null;

  const valueFromClientX = React.useCallback(
    (clientX: number) => {
      const el = rootRef.current;
      if (!el) return low;

      const rect = el.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width || 1);
      const t = x / (rect.width || 1);
      const raw = min + t * (max - min);
      const snapped = snap(raw, step);
      return clamp(snapped, min, max);
    },
    [min, max, step, low]
  );

  const commit = React.useCallback(
    (nextLow: number, nextHigh: number) => {
      const a = Math.min(nextLow, nextHigh);
      const b = Math.max(nextLow, nextHigh);
      onValueCommit?.([a, b]);
    },
    [onValueCommit]
  );

  const setBoth = React.useCallback(
    (nextLow: number, nextHigh: number, isCommit: boolean) => {
      const a = Math.min(nextLow, nextHigh);
      const b = Math.max(nextLow, nextHigh);
      onValueChange([a, b]);
      if (isCommit) commit(a, b);
    },
    [onValueChange, commit]
  );

  const pickNearestThumb = React.useCallback(
    (clientX: number) => {
      const el = rootRef.current;
      if (!el) return "min" as const;

      const rect = el.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width || 1);
      const lowX = (lowPct / 100) * (rect.width || 1);
      const highX = (highPct / 100) * (rect.width || 1);
      const dLow = Math.abs(x - lowX);
      const dHigh = Math.abs(x - highX);
      return dLow <= dHigh ? ("min" as const) : ("max" as const);
    },
    [lowPct, highPct]
  );

  const startDrag = React.useCallback(
    (which: "min" | "max", pointerId: number, clientX: number) => {
      if (disabled) return;

      activePointerIdRef.current = pointerId;
      setActive(which);

      const v = valueFromClientX(clientX);
      if (which === "min") {
        setBoth(Math.min(v, high), high, false);
      } else {
        setBoth(low, Math.max(v, low), false);
      }
    },
    [disabled, valueFromClientX, setBoth, low, high]
  );

  // Global listeners while dragging => robust (ne gubi se drag kad izađeš iz elementa)
  React.useEffect(() => {
    if (!active) return;

    const onMove = (e: PointerEvent) => {
      if (disabled) return;
      if (activePointerIdRef.current != null && e.pointerId !== activePointerIdRef.current) return;

      const v = valueFromClientX(e.clientX);
      if (active === "min") {
        const nextLow = Math.min(v, high);
        setBoth(nextLow, high, false);
      } else {
        const nextHigh = Math.max(v, low);
        setBoth(low, nextHigh, false);
      }
    };

    const onUp = (e: PointerEvent) => {
      if (activePointerIdRef.current != null && e.pointerId !== activePointerIdRef.current) return;

      const v = valueFromClientX(e.clientX);
      if (active === "min") {
        const nextLow = Math.min(v, high);
        onValueChange([nextLow, high]);
        commit(nextLow, high);
      } else {
        const nextHigh = Math.max(v, low);
        onValueChange([low, nextHigh]);
        commit(low, nextHigh);
      }

      activePointerIdRef.current = null;
      setActive(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [active, disabled, valueFromClientX, setBoth, low, high, onValueChange, commit]);

  const onTrackPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    const which = pickNearestThumb(e.clientX);
    startDrag(which, e.pointerId, e.clientX);
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        // Bitno: ne gasimo active ovde — dok vučeš, kursor može da izađe iz wrappera
        setHovered(false);
      }}
    >
      <div className="relative pt-10 pb-6">
        {showTooltips && !disabled && (
          <>
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border px-2 py-1 text-[11px] font-semibold shadow-sm"
              style={{
                left: `${lowPct}%`,
                background: "rgb(254 243 199)", // amber-100
                borderColor: "rgb(253 230 138)", // amber-200
                color: "rgb(120 53 15)", // amber-900-ish
              }}
            >
              {fmt(low)}
            </div>
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border px-2 py-1 text-[11px] font-semibold shadow-sm"
              style={{
                left: `${highPct}%`,
                background: "rgb(254 243 199)",
                borderColor: "rgb(253 230 138)",
                color: "rgb(120 53 15)",
              }}
            >
              {fmt(high)}
            </div>
          </>
        )}

        <div
          ref={rootRef}
          className={`relative h-10 w-full ${disabled ? "opacity-50" : ""}`}
          onPointerDown={onTrackPointerDown}
        >
          {/* base track */}
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-black/10" />

          {/* active range track (amber) */}
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
            style={{
              left: `${lowPct}%`,
              width: `${Math.max(0, highPct - lowPct)}%`,
              background: "rgb(245 158 11)", // amber-500
            }}
          />

          {/* thumbs: ~2x smaller; malo veći od trake */}
          <button
            type="button"
            disabled={disabled}
            className={`absolute top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white shadow ${
              disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
            }`}
            style={{
              left: `${lowPct}%`,
              zIndex: active === "min" ? 30 : 20,
              borderColor: "rgb(253 230 138)", // amber-200
              boxShadow: "0 6px 14px rgba(15,23,42,0.12)",
            }}
            onPointerDown={(e) => {
              if (disabled) return;
              e.preventDefault();
              e.stopPropagation();
              startDrag("min", e.pointerId, e.clientX);
            }}
            aria-label="Minimalna cena"
            title="Minimalna cena"
          />

          <button
            type="button"
            disabled={disabled}
            className={`absolute top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-white shadow ${
              disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
            }`}
            style={{
              left: `${highPct}%`,
              zIndex: active === "max" ? 30 : 25,
              borderColor: "rgb(253 230 138)",
              boxShadow: "0 6px 14px rgba(15,23,42,0.12)",
            }}
            onPointerDown={(e) => {
              if (disabled) return;
              e.preventDefault();
              e.stopPropagation();
              startDrag("max", e.pointerId, e.clientX);
            }}
            aria-label="Maksimalna cena"
            title="Maksimalna cena"
          />
        </div>
      </div>
    </div>
  );
}
