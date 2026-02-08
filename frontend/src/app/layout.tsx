import "./globals.css";
import Providers from "./providers";
import SiteShell from "@/components/layout/SiteShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <body>
        <Providers>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
