import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";

const links: { href: AppPathname; key: "consulting" | "course" | "mentorship" | "about" }[] = [
  { href: "/consulting", key: "consulting" },
  { href: "/course", key: "course" },
  { href: "/mentorship", key: "mentorship" },
  { href: "/about", key: "about" },
];

export async function Header() {
  const t = await getTranslations("common");

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-white/95 backdrop-blur">
      <Container className="relative flex h-16 items-center justify-between gap-4">
        {/* No aria-label: the visible wordmark text is the accessible name. */}
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="h-8 w-auto text-navy" />
          <Wordmark className="text-sm sm:text-base" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label={t("nav.home")}>
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

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/contact"
            className={buttonVariants("primary", "md", "hidden md:inline-flex")}
          >
            {t("nav.contact")}
          </Link>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
