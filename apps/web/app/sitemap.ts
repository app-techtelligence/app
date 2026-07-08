import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppPathname, type Locale } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

const pathnames = Object.keys(routing.pathnames) as AppPathname[];

function absoluteUrl(href: AppPathname, locale: Locale): string {
  return siteConfig.url + getPathname({ href, locale });
}

/** One entry per page with hreflang alternates for both locales. */
export default function sitemap(): MetadataRoute.Sitemap {
  return pathnames.map((href) => ({
    url: absoluteUrl(href, routing.defaultLocale),
    changeFrequency: "monthly",
    priority: href === "/" ? 1 : 0.8,
    alternates: {
      languages: {
        "pt-BR": absoluteUrl(href, "pt-BR"),
        en: absoluteUrl(href, "en"),
        "x-default": absoluteUrl(href, routing.defaultLocale),
      },
    },
  }));
}
