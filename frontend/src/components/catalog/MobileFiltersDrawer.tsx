"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";

type Props = {
  title?: string;
  activeCount: number;

  /** Small row under title (optional) */
  subtitle?: React.ReactNode;

  canReset?: boolean;
  onReset?: () => void;

  children: React.ReactNode;
};

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export function MobileFiltersDrawer({
  title = "Filteri",
  activeCount,
  subtitle,
  canReset,
  onReset,
  children,
}: Props) {
  const [open, setOpen] = React.useState(false);

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

  const badgeWidth = activeCount >= 10 ? "w-6" : "w-5";

  return (
    <>
      <button
        type="button"
        className={cx("mic-btn h-9 px-3 text-[12px] font-medium", activeCount > 0 ? "font-semibold" : "")}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Otvori filtere"
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filteri

        {activeCount > 0 ? (
          <span
            className={cx(
              "ml-2",
              // ✅ true geometric centering
              "inline-flex items-center justify-center",
              "h-5",
              badgeWidth,
              "rounded-full bg-black text-white",
              // ✅ remove baseline influence
              "text-[11px] font-semibold leading-none tabular-nums",
              // ✅ optical nudge up (fixes “dole malo”)
              "relative -top-[0.5px]"
            )}
            aria-label={`Aktivnih filtera: ${activeCount}`}
            title={`Aktivnih filtera: ${activeCount}`}
          >
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button type="button" className="mic-overlay" onClick={() => setOpen(false)} aria-label="Zatvori filtere" />

          <div role="dialog" aria-modal="true" className="mic-drawer mic-drawer-right">
            <div className="mic-drawer-header">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold">{title}</div>
                {subtitle ? <div className="mt-0.5 text-[11px] mic-muted-2">{subtitle}</div> : null}
              </div>

              <button
                type="button"
                className="mic-btn h-9 w-9 p-0"
                onClick={() => setOpen(false)}
                aria-label="Zatvori"
                title="Zatvori"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-4 py-3">
              {children}
              <div className="h-16" />
            </div>

            <div className="border-t bg-white/92 backdrop-blur px-4 py-3" style={{ borderColor: "rgb(var(--border))" }}>
              <button
                type="button"
                className={cx(canReset ? "mic-btn-primary" : "mic-btn", "h-10 w-full disabled:opacity-50")}
                onClick={() => onReset?.()}
                disabled={!canReset}
                title="Poništi filtere"
              >
                Poništi filtere
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
