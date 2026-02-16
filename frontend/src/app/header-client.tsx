"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileMenu } from "@/components/nav/MobileMenu";

export default function HeaderClient() {
  const pathname = usePathname();
  const isB2B = pathname.startsWith("/b2b");

  const [open, setOpen] = React.useState(false);

  // basePrefix: u B2B zonu linkovi idu sa /b2b
  const basePrefix = isB2B ? "/b2b" : "";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3">
        <button
          type="button"
          className="mic-btn h-10 w-10 p-0 md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Otvori meni"
          title="Meni"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href={basePrefix ? "/b2b" : "/"} className="shrink-0 text-sm font-extrabold tracking-tight">
          SHOP{isB2B ? " B2B" : ""}
        </Link>

        {/* Search */}
        <div className="hidden flex-1 md:block">
          <div className="relative">
            <input
              className="mic-input pr-10"
              placeholder={isB2B ? "Pretraga (B2B) — šifre, modeli…" : "Pretraga proizvoda, brendova, modela…"}
              aria-label="Pretraga"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs mic-muted">
              ⌘K
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href={isB2B ? "/" : "/b2b"} className="mic-btn text-xs">
            {isB2B ? "B2C" : "B2B"}
          </Link>
          <button className="mic-btn text-xs" type="button">
            Nalog
          </button>
          <button className="mic-btn-primary text-xs" type="button">
            {isB2B ? "Upit" : "Korpa"}
          </button>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="border-t md:hidden">
        <div className="mx-auto max-w-6xl px-3 py-2">
          <input className="mic-input" placeholder={isB2B ? "Pretraga (B2B)..." : "Pretraga..."} aria-label="Pretraga" />
        </div>
      </div>

      <MobileMenu open={open} onClose={() => setOpen(false)} basePrefix={basePrefix} />
    </header>
  );
}
