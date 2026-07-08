import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Container } from "@/components/ui/Container";

const productLinks: { href: AppPathname; key: "course" | "mentorship" | "consulting" }[] = [
  { href: "/course", key: "course" },
  { href: "/mentorship", key: "mentorship" },
  { href: "/consulting", key: "consulting" },
];

export async function Footer() {
  const t = await getTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-8 w-auto text-white" />
            <Wordmark onDark className="text-sm" />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            {t("footer.description")}
          </p>
        </div>

        <nav aria-label={t("footer.products")}>
          <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">
            {t("footer.products")}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {productLinks.map(({ href, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  {t(`nav.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("footer.company")}>
          <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">
            {t("footer.company")}
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/about" className="text-sm text-white/80 transition-colors hover:text-white">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-sm text-white/80 transition-colors hover:text-white">
                {t("nav.contact")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-sm text-white/80 transition-colors hover:text-white">
                {t("footer.privacy")}
              </Link>
            </li>
          </ul>
        </nav>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <p>
            © {year} {siteConfig.name}. {t("footer.rights")}
          </p>
        </Container>
      </div>
    </footer>
  );
}
