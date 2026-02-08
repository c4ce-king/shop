"use client";

import * as React from "react";

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-black/5 text-black",
    outline: "border border-black/15 text-black",
  };

  return <span className={cx(base, variants[variant], className)} {...props} />;
}
