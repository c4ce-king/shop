"use client";

import * as React from "react";
import { X, SlidersHorizontal } from "lucide-react";

type Props = {
  title?: string;
  activeCount: number;
  children: React.ReactNode;

  /** optional: render a small summary row under title */
  subtitle?: React.ReactNode;
};

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export function MobileFiltersDrawer({ title = "Filteri", activeCount, subtitle, children }: Props) {
  const [open, setOpen] = React.useState(false);

  // lock body scroll when open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC closes
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
      {/* Trigger */}
      <button
        type="button"
        className="mic-btn h-9 px-3 text-[12px] font-medium"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Otvori filtere"
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filteri
        {activeCount > 0 ? (
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {/* Overlay + Drawer */}
      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpen(false)}
            aria-label="Zatvori filtere"
          />

          <div
            role="dialog"
            aria-modal="true"
            className={cx(
              "absolute right-0 top-0 h-full w-[92vw] max-w-[420px] bg-white shadow-2xl",
              "flex flex-col"
            )}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold">{title}</div>
                {subtitle ? <div className="mt-0.5 text-[11px] mic-muted">{subtitle}</div> : null}
              </div>

              <button
                type="button"
                className="mic-btn h-9 w-9"
                onClick={() => setOpen(false)}
                aria-label="Zatvori"
                title="Zatvori"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-4 py-3">{children}</div>

            <div className="border-t px-4 py-3">
              <button type="button" className="mic-btn-solid h-10 w-full" onClick={() => setOpen(false)}>
                Primeni i zatvori
              </button>
              <div className="mt-2 text-center text-[11px] mic-muted">
                (Filteri se primenjuju odmah – ovo samo zatvara drawer)
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
