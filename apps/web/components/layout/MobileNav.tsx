"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type StaticAppPathname } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/Button";
import { CheckIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";
import { localeSwitchHref } from "@/lib/locale-switch";
import { LOCALE_LABELS, useActiveLocale } from "./LocaleSwitcher";

const links: { href: StaticAppPathname; key: "course" | "mentorship" | "blog" | "about" }[] = [
  { href: "/course", key: "course" },
  { href: "/mentorship", key: "mentorship" },
  { href: "/blog", key: "blog" },
  { href: "/about", key: "about" },
];

const serviceLinks: { href: StaticAppPathname; key: "servicesAi" | "servicesDataGovernance" }[] = [
  { href: "/consulting/ai", key: "servicesAi" },
  { href: "/consulting/data-governance", key: "servicesDataGovernance" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("common");
  // The language switcher is header-only from `md` up, so on mobile it lives
  // here — as plain rows, since a dropdown inside an open panel is redundant.
  const localeHref = localeSwitchHref(usePathname());
  const activeLocale = useActiveLocale();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-navy"
      >
        {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-navy/10 bg-white shadow-lg">
          <nav className="flex flex-col px-4 py-3">
            <Link
              href="/consulting"
              onClick={() => setOpen(false)}
              className="py-3 text-base font-semibold text-navy"
            >
              {t("nav.services")}
            </Link>
            {serviceLinks.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="border-b border-navy/5 py-2.5 pl-4 text-sm font-semibold text-navy/75 last:border-b-0"
              >
                {t(`nav.${key}`)}
              </Link>
            ))}
            {links.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="border-b border-navy/5 py-3 text-base font-semibold text-navy last:border-b-0"
              >
                {t(`nav.${key}`)}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className={buttonVariants("primary", "md", "mt-3 mb-2")}
            >
              {t("nav.contact")}
            </Link>

            <div className="mt-1 border-t border-navy/10 pt-3 pb-1">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-steel">
                {t("localeSwitcher.label")}
              </p>
              {routing.locales.map((candidate) =>
                candidate === activeLocale ? (
                  <span
                    key={candidate}
                    aria-current="true"
                    className="flex items-center gap-2 py-2.5 text-base font-bold text-navy"
                  >
                    {LOCALE_LABELS[candidate]}
                    <CheckIcon className="h-4 w-4" />
                  </span>
                ) : (
                  <Link
                    key={candidate}
                    href={localeHref}
                    locale={candidate}
                    onClick={() => setOpen(false)}
                    className="block py-2.5 text-base font-semibold text-navy/75"
                  >
                    {LOCALE_LABELS[candidate]}
                  </Link>
                ),
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
