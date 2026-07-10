import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type StaticAppPathname } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

const ogLocales: Record<Locale, string> = {
  "pt-BR": "pt_BR",
  en: "en_US",
};

function absoluteUrl(href: StaticAppPathname, locale: Locale): string {
  return siteConfig.url + getPathname({ href, locale });
}

/**
 * Per-locale metadata for a static page: title/description from the page's
 * `meta` messages, canonical + hreflang alternates (x-default → pt-BR),
 * and localized OG tags. Canonical also shields the directly-reachable
 * internal /pt-BR/* asset paths from duplicate-content indexing.
 */
export async function pageMetadata(
  requestedLocale: string,
  namespace: string,
  href: StaticAppPathname,
): Promise<Metadata> {
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: `${namespace}.meta` });
  const canonical = absoluteUrl(href, locale);

  return {
    metadataBase: new URL(siteConfig.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical,
      languages: {
        "pt-BR": absoluteUrl(href, "pt-BR"),
        en: absoluteUrl(href, "en"),
        "x-default": absoluteUrl(href, routing.defaultLocale),
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonical,
      siteName: siteConfig.name,
      locale: ogLocales[locale],
      type: "website",
      images: [{ url: "/og/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}
