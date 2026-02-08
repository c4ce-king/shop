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

  const fmt = React.useCallback(
    (n: number) => (format ? format(n) : String(Math.round(n))),
    [format]
  );

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

      // ako su blizu, bira bliži; ako su jednaki, preferiraj MIN (da levi ne bude “mrtav”)
      return dLow <= dHigh ? ("min" as const) : ("max" as const);
    },
    [lowPct, highPct]
  );

  const onTrackPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    const which = pickNearestThumb(e.clientX);
    setActive(which);

    const v = valueFromClientX(e.clientX);
    if (which === "min") {
      setBoth(Math.min(v, high), high, false);
    } else {
      setBoth(low, Math.max(v, low), false);
    }

    // capture za drag
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled) return;
    if (!active) return;
    const v = valueFromClientX(e.clientX);

    if (active === "min") {
      const nextLow = Math.min(v, high);
      setBoth(nextLow, high, false);
    } else {
      const nextHigh = Math.max(v, low);
      setBoth(low, nextHigh, false);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (disabled) return;
    if (!active) return;

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

    setActive(null);

    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setActive(null);
      }}
    >
      {/* rezervisan prostor za tooltip iznad + da ne preklapa ispod */}
      <div className="relative pt-10 pb-6">
        {/* tooltips — striktno iznad thumbova */}
        {showTooltips && !disabled && (
          <>
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border bg-white px-2 py-1 text-[11px] shadow-sm"
              style={{ left: `${lowPct}%` }}
            >
              {fmt(low)}
            </div>
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border bg-white px-2 py-1 text-[11px] shadow-sm"
              style={{ left: `${highPct}%` }}
            >
              {fmt(high)}
            </div>
          </>
        )}

        {/* track + range + thumbs */}
        <div
          ref={rootRef}
          className={`relative h-10 w-full ${disabled ? "opacity-50" : ""}`}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setActive(null)}
        >
          {/* Track */}
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-black/10" />
          {/* Active range */}
          <div
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-black/70"
            style={{ left: `${lowPct}%`, width: `${Math.max(0, highPct - lowPct)}%` }}
          />

          {/* Thumbs (veliki hit area) */}
          <button
            type="button"
            disabled={disabled}
            className={`absolute top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/90 shadow-md ${
              disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
            }`}
            style={{ left: `${lowPct}%`, zIndex: active === "min" ? 30 : 20 }}
            onPointerDown={(e) => {
              if (disabled) return;
              e.stopPropagation();
              setActive("min");
              (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
            }}
          />
          <button
            type="button"
            disabled={disabled}
            className={`absolute top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/90 shadow-md ${
              disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
            }`}
            style={{ left: `${highPct}%`, zIndex: active === "max" ? 30 : 25 }}
            onPointerDown={(e) => {
              if (disabled) return;
              e.stopPropagation();
              setActive("max");
              (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
            }}
          />
        </div>
      </div>
    </div>
  );
}
