// frontend/src/lib/seo.ts
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, TITLE_TEMPLATE } from "@/config/site";

type SeoArgs = {
  title?: string | null;        // "Patike", "Muške patike", ...
  description?: string | null;  // meta description
  canonicalPath?: string | null; // "/kategorija/patike"
  noindex?: boolean;
};

/**
 * Koristi ovo u generateMetadata() na stranicama.
 * Ako proslediš title, dobićeš "%s | SITE_NAME".
 * Ako ne, default je SITE_NAME.
 */
export function buildMetadata(args: SeoArgs = {}): Metadata {
  const title = (args.title ?? "").trim();

  const metadataTitle: Metadata["title"] = title
    ? { default: SITE_NAME, template: TITLE_TEMPLATE, absolute: title }
    : { default: SITE_NAME, template: TITLE_TEMPLATE };

  const canonical =
    args.canonicalPath && args.canonicalPath.startsWith("/")
      ? new URL(args.canonicalPath, SITE_URL).toString()
      : undefined;

  return {
    title: metadataTitle,
    description: args.description ?? undefined,
    alternates: canonical ? { canonical } : undefined,
    robots: args.noindex ? { index: false, follow: false } : undefined,
    metadataBase: new URL(SITE_URL),
  };
}