"use client";

import Link from "next/link";
import { MegaMenu } from "@/components/nav/MegaMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Shop
          </Link>
          <MegaMenu />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-sm px-3 py-2 rounded-full border hover:bg-black/5"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
