"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ShoppingCart, Heart, ArrowLeftRight } from "lucide-react";
import { MegaMenu } from "@/components/nav/MegaMenu";
import { MobileMenuDrawer } from "@/components/nav/MobileMenuDrawer";

import { useUiCart } from "../../store/uiCart";

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  const label = n > 99 ? "99+" : String(n);

  return (
    <span
      className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold tabular-nums
                 bg-black text-white inline-flex items-center justify-center shadow"
      aria-label={`Broj: ${label}`}
      title={label}
    >
      {label}
    </span>
  );
}

function HeaderIconButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl
                 bg-white/70 backdrop-blur shadow-[0_6px_18px_rgba(0,0,0,0.10)]
                 hover:bg-white hover:-translate-y-[1px] active:translate-y-0 transition"
    >
      {children}
    </Link>
  );
}

export function Header() {
  const [q, setQ] = React.useState("");

  const cartCount = useUiCart((s) => s.cart.size);
  const wishCount = useUiCart((s) => s.wishlist.size);
  const compareCount = useUiCart((s) => s.compare.size);

  // MVP: samo UX (kasnije ide real search page / API)
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    // za sada vodi na home sa ?q=...
    window.location.href = `/?q=${encodeURIComponent(q.trim())}`;
  };

  return (
    <header className="mic-header">
      <div className="mic-container">
        <div className="mic-header-row">
          {/* Mobile menu */}
          <div className="lg:hidden">
            <MobileMenuDrawer />
          </div>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <div className="text-[14px] font-extrabold tracking-tight">SHOP</div>
            <div className="text-[10px] mic-muted-2 -mt-0.5">B2C</div>
          </Link>

          {/* Desktop mega menu */}
          <div className="hidden lg:block ml-2">
            <MegaMenu />
          </div>

          {/* Search */}
          <form onSubmit={onSubmit} className="ml-auto flex w-full max-w-[560px] items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
              <input
                className="mic-input w-full pl-9"
                placeholder="Pretraga proizvoda (npr. lelo, lateks, wand...)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button type="submit" className="mic-btn h-9 px-3 text-[12px] font-semibold">
              Traži
            </button>
          </form>

          {/* Actions (same row, compact) */}
          <div className="ml-2 flex items-center gap-2">
            <HeaderIconButton href="/wishlist" label="Omiljeno">
              <Heart className="h-4 w-4 text-black/75" />
              <Badge n={wishCount} />
            </HeaderIconButton>

            <HeaderIconButton href="/compare" label="Poređenje">
              <ArrowLeftRight className="h-4 w-4 text-black/75" />
              <Badge n={compareCount} />
            </HeaderIconButton>

            <HeaderIconButton href="/cart" label="Korpa">
              <ShoppingCart className="h-4 w-4 text-black/85" />
              <Badge n={cartCount} />
            </HeaderIconButton>
          </div>
        </div>

        {/* Secondary row (desktop quick links) */}
        <div className="mt-2 hidden lg:flex items-center gap-3 text-[12px] mic-muted pb-3">
          <Link href="/" className="hover:underline">
            Ponude
          </Link>
          <Link href="/" className="hover:underline">
            Najprodavanije
          </Link>
          <Link href="/" className="hover:underline">
            Brza isporuka
          </Link>
          <span className="ml-auto mic-muted-2">MIC-like UI, brži mobile</span>
        </div>
      </div>
    </header>
  );
}