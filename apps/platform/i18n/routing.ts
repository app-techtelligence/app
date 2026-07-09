import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en"],
  defaultLocale: "pt-BR",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/login": {
      "pt-BR": "/entrar",
      en: "/login",
    },
    "/signup": {
      "pt-BR": "/criar-conta",
      en: "/signup",
    },
    "/verify-email": {
      "pt-BR": "/verifique-seu-email",
      en: "/verify-email",
    },
    "/dashboard": {
      "pt-BR": "/painel",
      en: "/dashboard",
    },
    "/course/[slug]": {
      "pt-BR": "/curso/[slug]",
      en: "/course/[slug]",
    },
    "/course/[slug]/lesson/[lessonSlug]": {
      "pt-BR": "/curso/[slug]/aula/[lessonSlug]",
      en: "/course/[slug]/lesson/[lessonSlug]",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
