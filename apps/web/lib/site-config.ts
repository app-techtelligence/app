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
  /**
   * Inbox that receives contact-form submissions.
   * FREE TIER: Resend can only deliver to your own Resend account email until
   * a domain is verified. Set this to that email. TODO: confirm this address.
   */
  contactEmail: "leandro.lf.frazao@hotmail.com",
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
