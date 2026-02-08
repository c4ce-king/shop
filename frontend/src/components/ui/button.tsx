"use client";

import * as React from "react";

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      default: "bg-black text-white hover:bg-black/90",
      outline: "border border-black/15 bg-white hover:bg-black/5",
      ghost: "hover:bg-black/5",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      default: "h-9 px-4",
      sm: "h-8 px-3 text-xs",
    };

    return (
      <button
        ref={ref}
        className={cx(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
