"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const labels: Record<Locale, string> = {
  "pt-BR": "PT",
  en: "EN",
};

/** PT | EN toggle — always visible in the header (CLAUDE.md §5). */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common.localeSwitcher");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="flex items-center rounded-md border border-navy/15 p-0.5 text-xs font-bold"
    >
      {routing.locales.map((candidate) => {
        const isActive = candidate === locale;
        return (
          <Link
            key={candidate}
            // usePathname returns the internal pathname; all routes are static.
            href={pathname}
            locale={candidate}
            aria-current={isActive ? "true" : undefined}
            className={`rounded px-2 py-1 transition-colors ${
              isActive
                ? "bg-navy text-white"
                : "text-steel hover:text-navy"
            }`}
          >
            {labels[candidate]}
          </Link>
        );
      })}
    </nav>
  );
}
