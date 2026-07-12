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
    "/change-password": {
      "pt-BR": "/alterar-senha",
      en: "/change-password",
    },
    "/course/[slug]": {
      "pt-BR": "/curso/[slug]",
      en: "/course/[slug]",
    },
    "/course/[slug]/lesson/[lessonSlug]": {
      "pt-BR": "/curso/[slug]/aula/[lessonSlug]",
      en: "/course/[slug]/lesson/[lessonSlug]",
    },
    "/job-tracker": {
      "pt-BR": "/vagas",
      en: "/job-tracker",
    },
    "/admin": "/admin",
    "/admin/course/[id]": "/admin/course/[id]",
    "/admin/blog": "/admin/blog",
    "/admin/blog/[id]": "/admin/blog/[id]",
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
