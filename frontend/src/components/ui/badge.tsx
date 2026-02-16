"use client";

import * as React from "react";

type Variant = "neutral" | "hot" | "new" | "sale" | "b2b";

const VARIANT_CLASS: Record<Variant, string> = {
  neutral: "bg-black/5 text-black/70 border-black/10",
  hot: "bg-orange-50 text-orange-700 border-orange-200",
  new: "bg-blue-50 text-blue-700 border-blue-200",
  sale: "bg-red-50 text-red-700 border-red-200",
  b2b: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
  title,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-4 font-medium",
        VARIANT_CLASS[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
