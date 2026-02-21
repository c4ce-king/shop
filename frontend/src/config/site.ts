// frontend/src/config/site.ts
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Srbija Shop";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

/**
 * Ako hoćeš da “brand” bude uvek isti na kraju title-a:
 *  - template: "%s | SITE_NAME"
 *  - default: SITE_NAME
 */
export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;