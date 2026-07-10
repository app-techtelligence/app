import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en"],
  defaultLocale: "pt-BR",
  // Portuguese lives at the root (/curso), English under /en (/en/course).
  localePrefix: "as-needed",
  // The middleware's Link header would advertise the SAME slug for both
  // locales on /blog/[slug] (post slugs differ per locale → 404 alternates).
  // Correct hreflang comes from generateMetadata and the sitemap instead.
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/consulting": {
      "pt-BR": "/consultoria",
      en: "/consulting",
    },
    "/consulting/ai": {
      "pt-BR": "/consultoria/ia",
      en: "/consulting/ai",
    },
    "/consulting/data-governance": {
      "pt-BR": "/consultoria/governanca-de-dados",
      en: "/consulting/data-governance",
    },
    "/course": {
      "pt-BR": "/curso",
      en: "/course",
    },
    "/mentorship": {
      "pt-BR": "/mentoria",
      en: "/mentorship",
    },
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/about": {
      "pt-BR": "/sobre",
      en: "/about",
    },
    "/contact": {
      "pt-BR": "/contato",
      en: "/contact",
    },
    "/privacy": {
      "pt-BR": "/privacidade",
      en: "/privacy",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
/** Pathnames without dynamic segments — usable as a bare Link href. */
export type StaticAppPathname = Exclude<AppPathname, `${string}[${string}`>;
