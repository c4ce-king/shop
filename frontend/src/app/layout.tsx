import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import HeaderClient from "./header-client";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop",
};

/**
 * "App-like" feel: prevent zoom (pinch/double-tap scaling)
 * NOTE: Ovo može malo da utiče na accessibility, ali je traženo ponašanje.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-only: bez hydration problema (footer je van Providers)
  const year = new Date().getFullYear();

  return (
    <html lang="sr">
      <body className="bg-[#fafafa] text-black">
        <Providers>
          <HeaderClient />
          {/* main wrapper ostaje ovde - ako ti neke stranice već imaju svoj container,
              lako ćemo kasnije prebaciti na "plain" */}
          <main className="mx-auto max-w-6xl px-3 py-4">{children}</main>
        </Providers>

        {/* Footer OUTSIDE Providers => server-render only => nema hydration mismatch */}
        <footer className="mt-10 border-t bg-white">
          <div className="mx-auto max-w-6xl px-3 py-6 text-xs mic-muted">
            © {year} Shop — B2C / B2B
          </div>
        </footer>
      </body>
    </html>
  );
}
