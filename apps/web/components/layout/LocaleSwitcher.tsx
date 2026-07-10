"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale, type StaticAppPathname } from "@/i18n/routing";

const labels: Record<Locale, string> = {
  "pt-BR": "PT",
  en: "EN",
};

/** PT | EN toggle — always visible in the header (CLAUDE.md §5). */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common.localeSwitcher");
  const pathname = usePathname();
  // Blog posts have locale-specific slugs, so a direct locale swap on
  // /blog/[slug] would 404 — fall back to the blog listing there.
  const href = (
    pathname.includes("[") ? "/blog" : pathname
  ) as StaticAppPathname;

  return (
    <nav
      aria-label={t("label")}
      className="flex items-center rounded-md border border-navy/15 p-0.5 text-xs font-bold"
    >
      {routing.locales.map((candidate) => {
        const isActive = candidate === locale;
        // The active locale is not a link — clicking it should never navigate
        // (relevant on post pages, where `href` falls back to the listing).
        if (isActive) {
          return (
            <span
              key={candidate}
              aria-current="true"
              className="rounded bg-navy px-2 py-1 text-white"
            >
              {labels[candidate]}
            </span>
          );
        }
        return (
          <Link
            key={candidate}
            href={href}
            locale={candidate}
            className="rounded px-2 py-1 text-steel transition-colors hover:text-navy"
          >
            {labels[candidate]}
          </Link>
        );
      })}
    </nav>
  );
}
