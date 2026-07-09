/**
 * Central place for site-wide values. The PLACEHOLDER values below are the
 * only spots to touch when the real contact details arrive.
 */
export const siteConfig = {
  name: "TechTelligence",
  /** Production origin — also used for canonical URLs, hreflang and OG tags. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://techtelligence.com.br",
  /** WhatsApp number, international format, digits only (Georgian +995). */
  whatsappNumber: "995557478927",
  /** Public contact inbox shown on the site (ProtonMail receives it directly). */
  contactEmail: "techtelligence@proton.me",
  /**
   * Where the contact FORM delivers, via Resend — internal, not shown on the site.
   * FREE TIER: without a verified domain, Resend only delivers to the email your
   * Resend account is registered with. Once you verify a domain in Resend, set
   * this to contactEmail (or a domain inbox) and update emailFrom below.
   */
  contactFormRecipient: "leandro.lf.frazao2@hotmail.com",
  /**
   * Sender for transactional email.
   * FREE TIER: must be onboarding@resend.dev until a domain is verified in
   * Resend. Swap to "TechTelligence <site@yourdomain>" once you have a domain.
   */
  emailFrom: "TechTelligence <onboarding@resend.dev>",
} as const;

/** wa.me deep link with an optional pre-filled, URL-encoded message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
