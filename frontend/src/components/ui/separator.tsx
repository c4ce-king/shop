"use client";

import * as React from "react";

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

export function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cx(
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        "bg-black/10",
        className
      )}
      {...props}
    />
  );
}
