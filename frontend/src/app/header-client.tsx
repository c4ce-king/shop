"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileMenu } from "@/components/nav/MobileMenu";

export default function HeaderClient() {
  const pathname = usePathname();
  const isB2B = pathname.startsWith("/b2b");

  const [open, setOpen] = React.useState(false);

  // basePrefix: u B2B zonu linkovi idu sa /b2b
  const basePrefix = isB2B ? "/b2b" : "";

  return (
    <header className="mic-header">
      <div className="mic-container">
        <div className="mic-header-row">
          <button
            type="button"
            className="mic-btn h-10 w-10 p-0 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Otvori meni"
            title="Meni"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href={basePrefix ? "/b2b" : "/"} className="shrink-0">
            <div className="text-[14px] font-extrabold tracking-tight">SHOP{isB2B ? " B2B" : ""}</div>
            <div className="text-[10px] mic-muted-2 -mt-0.5">katalog • brza kupovina</div>
          </Link>

          {/* Search (desktop) */}
          <div className="hidden flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <input
                className="mic-input pl-9 pr-3"
                placeholder={isB2B ? "Pretraga (B2B) — šifre, modeli…" : "Pretraga proizvoda, brendova, modela…"}
                aria-label="Pretraga"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* B2B toggle ostaje gore pored naloga */}
            <Link href={isB2B ? "/" : "/b2b"} className="mic-btn h-9 text-xs">
              {isB2B ? "B2C" : "B2B"}
            </Link>

            <button className="mic-btn h-9 text-xs" type="button">
              Nalog
            </button>

            {/* NOTE: ranije je u B2B stajalo "Upit". Skidamo za sada.
                Kad krene B2B gating/sekcije, lako vraćamo:
                <button className="mic-btn-primary h-9 text-xs" type="button">{isB2B ? "Upit" : "Korpa"}</button>
             */}
            <button className="mic-btn-primary h-9 text-xs" type="button">
              Korpa
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="border-t md:hidden" style={{ borderColor: "rgb(var(--border))" }}>
          <div className="py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
              <input className="mic-input pl-9" placeholder={isB2B ? "Pretraga (B2B)…" : "Pretraga…"} aria-label="Pretraga" />
            </div>
          </div>
        </div>
      </div>

      <MobileMenu open={open} onClose={() => setOpen(false)} basePrefix={basePrefix} />
    </header>
  );
}
