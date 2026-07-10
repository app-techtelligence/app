/**
 * Central place for site-wide values. The PLACEHOLDER values below are the
 * only spots to touch when the real contact details arrive.
 */
export const siteConfig = {
  name: "TechTelligence",
  /** Production origin — also used for canonical URLs, hreflang and OG tags. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://techtelligence.net",
  /** WhatsApp number, international format, digits only (Georgian +995). */
  whatsappNumber: "995557478927",
  /** Public contact inbox shown on the site (forwards handled by Proton). */
  contactEmail: "contato@techtelligence.net",
  /** Where the contact FORM delivers via Resend (Proton inbox behind it). */
  contactFormRecipient: "techtelligence@proton.me",
  /** Verified Resend sender on the company domain. */
  emailFrom: "TechTelligence <noreply@techtelligence.net>",
  /** Course platform origin (apps/platform, worker "platform"). */
  platformUrl: "https://plataforma.techtelligence.net",
} as const;

/** Platform login URL — PT lives at the root (/entrar), EN under /en/login. */
export function platformLoginUrl(locale: string): string {
  return locale === "en"
    ? `${siteConfig.platformUrl}/en/login`
    : `${siteConfig.platformUrl}/entrar`;
}

/** wa.me deep link with an optional pre-filled, URL-encoded message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
