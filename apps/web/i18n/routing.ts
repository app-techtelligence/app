import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en"],
  defaultLocale: "pt-BR",
  // Portuguese lives at the root (/curso), English under /en (/en/course).
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/course": {
      "pt-BR": "/curso",
      en: "/course",
    },
    "/mentorship": {
      "pt-BR": "/mentoria",
      en: "/mentorship",
    },
    "/consulting": {
      "pt-BR": "/consultoria",
      en: "/consulting",
    },
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
