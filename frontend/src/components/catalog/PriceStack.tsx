"use client";

import * as React from "react";

type Props = {
  priceRsd: number; // current
  oldPriceRsd?: number | null; // old optional
  className?: string;
};

const nfSR = new Intl.NumberFormat("sr-RS");

function formatRsd(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return nfSR.format(Math.round(n)) + " RSD";
}

export function PriceStack({ priceRsd, oldPriceRsd, className }: Props) {
  const hasOld =
    oldPriceRsd !== null &&
    oldPriceRsd !== undefined &&
    Number.isFinite(oldPriceRsd) &&
    (oldPriceRsd as number) > priceRsd;

  return (
    <div className={["leading-tight", className].filter(Boolean).join(" ")}>
      <div className="text-[14px] font-bold text-black/90">
        {formatRsd(priceRsd)}
      </div>

      {hasOld ? (
        <div className="text-[12px] text-black/50 line-through tabular-nums">
          {formatRsd(oldPriceRsd as number)}
        </div>
      ) : (
        // placeholder da layout ostane stabilan/kompaktan
        <div className="text-[12px] text-transparent select-none">_</div>
      )}
    </div>
  );
}