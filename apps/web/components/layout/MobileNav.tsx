"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { StaticAppPathname } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/Button";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";

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
          </nav>
        </div>
      ) : null}
    </div>
  );
}
