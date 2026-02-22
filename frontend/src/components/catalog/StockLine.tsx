"use client";

import * as React from "react";

type Props = {
  stockQty?: number | null;
  className?: string;
};

export function StockLine({ stockQty, className }: Props) {
  const qty = Number.isFinite(stockQty as number) ? (stockQty as number) : 0;

  // Pravilo iz zahteva:
  // qty <= 0 => crveno
  // qty < 3  => narandzasto (1-2)
  // else     => zeleno (>=3)
  let text = "Proizvod nije dostupan";
  let colorClass = "text-red-600";

  if (qty > 0 && qty < 3) {
    text = "Pri kraju zaliha";
    colorClass = "text-orange-600";
  } else if (qty >= 3) {
    text = "Na stanju";
    colorClass = "text-green-600";
  }

  return (
    <div className={["mt-1 leading-tight", className].filter(Boolean).join(" ")}>
      <span className={["text-[12px] font-semibold", colorClass].join(" ")}>
        {text}
      </span>
    </div>
  );
}