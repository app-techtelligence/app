"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { whatsappLink } from "@/lib/site-config";
import { buttonVariants } from "@/components/ui/Button";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "@/components/ui/icons";

const links: { href: AppPathname; key: "consulting" | "course" | "mentorship" | "about" | "contact" }[] = [
  { href: "/consulting", key: "consulting" },
  { href: "/course", key: "course" },
  { href: "/mentorship", key: "mentorship" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
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
            <a
              href={whatsappLink(t("cta.whatsappMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants("primary", "md", "mt-3 mb-2")}
            >
              <WhatsAppIcon className="h-4 w-4" />
              {t("cta.whatsapp")}
            </a>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
