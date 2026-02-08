import * as React from "react";
import { Header } from "@/components/nav/Header";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main>{children}</main>
    </div>
  );
}
