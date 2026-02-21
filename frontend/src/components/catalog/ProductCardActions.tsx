"use client";

import * as React from "react";
import { ShoppingCart, Heart, ArrowLeftRight } from "lucide-react";

import { uiCart, useUiCart, type Id } from "../../store/uiCart";

type Props = {
  productId: Id;

  disabled?: boolean;
  size?: "sm" | "md";
  variant?: "overlay" | "inline";
};

export function ProductCardActions({ productId, disabled = false, size = "md", variant = "inline" }: Props) {
  const key = String(productId);

  const wishlisted = useUiCart((s) => s.wishlist.has(key));
  const compared = useUiCart((s) => s.compare.has(key));
  const inCart = useUiCart((s) => s.cart.has(key));

  const btnSize = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const iconSize = size === "sm" ? 16 : 18;

  const wrap =
    variant === "overlay"
      ? "flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
      : "flex items-center gap-1.5";

  // MIC-like: bez bordera, blur + shadow kao dropdown
  const baseBtn =
    "relative inline-flex items-center justify-center rounded-xl " +
    "bg-white/80 backdrop-blur shadow-[0_6px_18px_rgba(0,0,0,0.12)] " +
    "transition-transform transition-colors will-change-transform " +
    "hover:bg-white hover:-translate-y-[1px] active:translate-y-0 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const neutralIcon = "text-black/70 hover:text-black";

  // ✅ Narandžasto PRIMARY (zakucano): koristi Tailwind !important + inline style fallback
  // Tailwind: orange-500 / orange-600 (MIC-like, jasno, ali ne previše neon)
  const cartBtn =
    "!bg-orange-500 !text-white " +
    "hover:!bg-orange-600 active:!bg-orange-600 " +
    "shadow-[0_10px_24px_rgba(0,0,0,0.16)]";

  const dot = "pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-black";

  return (
    <div className={wrap}>
      <button
        type="button"
        className={`${baseBtn} ${btnSize}`}
        onClick={() => uiCart.toggleWishlist(productId)}
        disabled={disabled}
        aria-label={wishlisted ? "Ukloni iz omiljenog" : "Dodaj u omiljeno"}
        title={wishlisted ? "Omiljeno: ukloni" : "Omiljeno"}
      >
        <Heart size={iconSize} className={neutralIcon} fill={wishlisted ? "currentColor" : "none"} strokeWidth={2} />
        {wishlisted ? <span className={dot} aria-hidden="true" /> : null}
      </button>

      <button
        type="button"
        className={`${baseBtn} ${btnSize}`}
        onClick={() => uiCart.toggleCompare(productId)}
        disabled={disabled}
        aria-label={compared ? "Ukloni iz poređenja" : "Uporedi"}
        title={compared ? "Upoređuješ" : "Uporedi"}
      >
        <ArrowLeftRight size={iconSize} className={neutralIcon} strokeWidth={2} />
        {compared ? <span className={dot} aria-hidden="true" /> : null}
      </button>

      <button
        type="button"
        className={`${baseBtn} ${cartBtn} ${btnSize}`}
        style={{ backgroundColor: "#F97316", color: "white" }} // fallback ako neki global CSS gazi utility klase
        onClick={() => uiCart.addCart(productId)}
        disabled={disabled}
        aria-label={inCart ? "U korpi" : "Dodaj u korpu"}
        title={inCart ? "U korpi" : "Dodaj u korpu"}
      >
        <ShoppingCart size={iconSize} className="text-white" strokeWidth={2} />
      </button>
    </div>
  );
}