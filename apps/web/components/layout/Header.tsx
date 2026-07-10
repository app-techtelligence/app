import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";

const links: { href: AppPathname; key: "course" | "mentorship" | "about" }[] = [
  { href: "/course", key: "course" },
  { href: "/mentorship", key: "mentorship" },
  { href: "/about", key: "about" },
];

const serviceLinks: { href: AppPathname; key: "servicesAi" | "servicesDataGovernance" }[] = [
  { href: "/consulting/ai", key: "servicesAi" },
  { href: "/consulting/data-governance", key: "servicesDataGovernance" },
];

export async function Header() {
  const t = await getTranslations("common");

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-white/95 backdrop-blur">
      <Container className="relative flex h-16 items-center justify-between gap-4">
        {/* Logo and nav grouped on the left (Allata-style); actions on the right. */}
        <div className="flex items-center gap-10">
          {/* No aria-label: the visible wordmark text is the accessible name. */}
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-8 w-auto text-navy" />
            <Wordmark className="text-sm sm:text-base" />
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label={t("nav.home")}>
          {/* CSS-only dropdown: opens on hover and on keyboard focus of any
              item inside (focus-within), so the Header stays a Server Component. */}
          <div className="group relative">
            <Link
              href="/consulting"
              className="flex items-center gap-1 text-sm font-semibold text-navy/75 transition-colors hover:text-navy"
            >
              {t("nav.services")}
              <ChevronDownIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
            </Link>
            {/* pt-2 bridges the hover gap between the trigger and the panel. */}
            <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="w-60 rounded-lg border border-navy/10 bg-white p-1.5 shadow-lg">
                {serviceLinks.map(({ href, key }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block rounded-md px-3 py-2.5 text-sm font-semibold text-navy/80 transition-colors hover:bg-canvas hover:text-navy"
                  >
                    {t(`nav.${key}`)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {links.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-semibold text-navy/75 transition-colors hover:text-navy"
            >
              {t(`nav.${key}`)}
            </Link>
          ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {/* Wrapper owns the responsive visibility: buttonVariants() hardcodes
              `inline-flex` in its base, which would override a `hidden` placed
              directly on the link and keep the button visible on mobile. */}
          <div className="hidden md:block">
            <Link href="/contact" className={buttonVariants("primary", "md")}>
              {t("nav.contact")}
            </Link>
          </div>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
