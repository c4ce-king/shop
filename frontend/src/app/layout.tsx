import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import HeaderClient from "./header-client";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Shop";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_NAME,
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
  const year = new Date().getFullYear();

  return (
    <html lang="sr">
      <body className="mic-page">
        <Providers>
          <HeaderClient />
          <main className="mic-container-main py-4">{children}</main>
        </Providers>

        <footer className="mt-10 border-t bg-white/80 backdrop-blur">
          <div className="mic-container py-6 text-[12px] mic-muted">
            © {year} {SITE_NAME} — B2C / B2B
          </div>
        </footer>
      </body>
    </html>
  );
}