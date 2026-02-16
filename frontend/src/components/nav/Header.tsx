"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { MegaMenu } from "@/components/nav/MegaMenu";
import { MobileMenuDrawer } from "@/components/nav/MobileMenuDrawer";

export function Header() {
  const [q, setQ] = React.useState("");

  // MVP: samo UX (kasnije ide real search page / API)
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    // za sada vodi na home sa ?q=...
    window.location.href = `/?q=${encodeURIComponent(q.trim())}`;
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto w-full max-w-6xl px-3 py-3">
        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <div className="lg:hidden">
            <MobileMenuDrawer />
          </div>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <div className="text-[14px] font-extrabold tracking-tight">SHOP</div>
            <div className="text-[10px] mic-muted-2 -mt-0.5">B2C / B2B</div>
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
        </div>

        {/* Secondary row (desktop quick links) */}
        <div className="mt-2 hidden lg:flex items-center gap-3 text-[12px] mic-muted">
          <Link href="/" className="hover:underline">Ponude</Link>
          <Link href="/" className="hover:underline">Najprodavanije</Link>
          <Link href="/" className="hover:underline">Brza isporuka</Link>
          <span className="ml-auto mic-muted-2">MIC-like UI, brži mobile</span>
        </div>
      </div>
    </header>
  );
}
