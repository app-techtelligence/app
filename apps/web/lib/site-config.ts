/**
 * Central place for site-wide values. The PLACEHOLDER values below are the
 * only spots to touch when the real contact details arrive.
 */
export const siteConfig = {
  name: "TechTelligence",
  /** Production origin — also used for canonical URLs, hreflang and OG tags. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://techtelligence.com.br",
  /** PLACEHOLDER — WhatsApp number in international format, digits only. */
  whatsappNumber: "5511999999999",
  /** PLACEHOLDER — inbox that receives contact-form submissions. */
  contactEmail: "contato@techtelligence.com.br",
  /** Sender for transactional email (must match a Resend-verified domain). */
  emailFrom: "TechTelligence <site@techtelligence.com.br>",
} as const;

/** wa.me deep link with an optional pre-filled, URL-encoded message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
