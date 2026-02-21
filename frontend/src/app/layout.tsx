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
      <body className="mic-page">
        <Providers>
          <HeaderClient />

          {/* Centralni sadržaj (širi) — ne diramo header/footer širinu */}
          <main className="mic-container-main py-4">{children}</main>
        </Providers>

        {/* Footer OUTSIDE Providers => server-render only => nema hydration mismatch */}
        <footer className="mt-10 border-t bg-white/80 backdrop-blur">
          <div className="mic-container py-6 text-[12px] mic-muted">
            © {year} Shop — B2C / B2B
          </div>
        </footer>
      </body>
    </html>
  );
}
