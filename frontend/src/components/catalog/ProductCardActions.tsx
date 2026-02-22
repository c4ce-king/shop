"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ShoppingCart, Heart, ArrowLeftRight } from "lucide-react";

import { uiCart, useUiCart, type Id } from "../../store/uiCart";

type Props = {
  productId: Id;
  disabled?: boolean;      // disables ALL actions
  disableCart?: boolean;   // disables ONLY add-to-cart (out of stock)
  size?: "sm" | "md";
  variant?: "overlay" | "inline";
};

type TipPos = { left: number; top: number; arrowLeft: number };

export function ProductCardActions({
  productId,
  disabled = false,
  disableCart = false,
  size = "md",
  variant = "inline",
}: Props) {
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

  const baseBtn =
    "relative inline-flex items-center justify-center rounded-xl " +
    "bg-white/80 backdrop-blur shadow-[0_6px_18px_rgba(0,0,0,0.12)] " +
    "transition-transform transition-colors will-change-transform " +
    "hover:bg-white hover:-translate-y-[1px] active:translate-y-0 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const neutralIcon = "text-black/70 hover:text-black";

  const cartBtn =
    "!bg-orange-500 !text-white " +
    "hover:!bg-orange-600 active:!bg-orange-600 " +
    "shadow-[0_10px_24px_rgba(0,0,0,0.16)]";

  const cartBtnDisabled =
    "!bg-black/25 !text-white " +
    "hover:!bg-black/25 active:!bg-black/25 " +
    "shadow-[0_6px_18px_rgba(0,0,0,0.10)]";

  const dot = "pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-black";

  const allDisabled = disabled;
  const cartDisabled = disabled || disableCart;

  const cartWrapRef = React.useRef<HTMLDivElement | null>(null);
  const tipRef = React.useRef<HTMLDivElement | null>(null);

  const [tipOpen, setTipOpen] = React.useState(false);
  const [tipPos, setTipPos] = React.useState<TipPos | null>(null);
  const [canPortal, setCanPortal] = React.useState(false);

  React.useEffect(() => setCanPortal(true), []);

  const TIP_PAD = 10; // razmak od ivica ekrana
  const GAP = 10;     // razmak od dugmeta do tooltip-a (ispod)

  function computeTipPos() {
    const el = cartWrapRef.current;
    const tipEl = tipRef.current;
    if (!el || !tipEl) return;

    const r = el.getBoundingClientRect();

    // realna širina tooltip-a (posle rendera)
    const tipW = Math.ceil(tipEl.getBoundingClientRect().width);

    const vw = window.innerWidth;
    const desiredLeft = r.left + r.width / 2 - tipW / 2;
    const clampedLeft = Math.max(TIP_PAD, Math.min(vw - TIP_PAD - tipW, desiredLeft));

    const arrowCenter = r.left + r.width / 2;
    const arrowLeft = Math.max(12, Math.min(tipW - 12, arrowCenter - clampedLeft));

    const top = r.bottom + GAP;

    setTipPos({ left: clampedLeft, top, arrowLeft });
  }

  function openTip() {
    if (!cartDisabled) return;
    setTipOpen(true);
    // 1) render tooltip, 2) izmeri width, 3) pozicioniraj
    requestAnimationFrame(() => {
      requestAnimationFrame(() => computeTipPos());
    });
  }

  function closeTip() {
    setTipOpen(false);
  }

  React.useEffect(() => {
    if (!tipOpen) return;

    const onScroll = () => computeTipPos();
    const onResize = () => computeTipPos();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [tipOpen]);

  const tooltipNode =
    canPortal && tipOpen
      ? createPortal(
          <div
            ref={tipRef}
            style={{
              position: "fixed",
              left: tipPos?.left ?? -9999,
              top: tipPos?.top ?? -9999,
              zIndex: 9999,
            }}
            className="pointer-events-none"
            role="tooltip"
            aria-hidden={!tipOpen}
          >
            {/* arrow (gore, pokazuje na dugme) */}
            <div
              style={{ left: (tipPos?.arrowLeft ?? 12) - 6 }}
              className="absolute -top-1.5 h-3 w-3 rotate-45 bg-orange-500 shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
            />
            <div className="inline-block rounded-md bg-orange-500 px-2 py-1 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] whitespace-nowrap">
              Nedostupno
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className={wrap}>
        <button
          type="button"
          className={`${baseBtn} ${btnSize}`}
          onClick={() => uiCart.toggleWishlist(productId)}
          disabled={allDisabled}
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
          disabled={allDisabled}
          aria-label={compared ? "Ukloni iz poređenja" : "Uporedi"}
          title={compared ? "Upoređuješ" : "Uporedi"}
        >
          <ArrowLeftRight size={iconSize} className={neutralIcon} strokeWidth={2} />
          {compared ? <span className={dot} aria-hidden="true" /> : null}
        </button>

        <div
          ref={cartWrapRef}
          onMouseEnter={openTip}
          onMouseLeave={closeTip}
          onFocus={openTip}
          onBlur={closeTip}
          className="relative"
        >
          <button
            type="button"
            className={`${baseBtn} ${cartDisabled ? cartBtnDisabled : cartBtn} ${btnSize}`}
            style={
              cartDisabled
                ? { backgroundColor: "rgba(0,0,0,0.25)", color: "white" }
                : { backgroundColor: "#F97316", color: "white" }
            }
            onClick={() => {
              if (cartDisabled) return;
              uiCart.addCart(productId);
            }}
            disabled={cartDisabled}
            aria-label={cartDisabled ? "Nedostupno" : inCart ? "U korpi" : "Dodaj u korpu"}
            title={cartDisabled ? "" : inCart ? "U korpi" : "Dodaj u korpu"}
          >
            <ShoppingCart size={iconSize} className="text-white" strokeWidth={2} />
          </button>
        </div>
      </div>

      {tooltipNode}
    </>
  );
}