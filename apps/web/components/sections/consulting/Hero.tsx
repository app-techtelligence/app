import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/brand/LogoMark";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";

export async function Hero() {
  const t = await getTranslations("consulting.hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy to-navy-deep">
      <LogoMark className="pointer-events-none absolute -right-16 -top-10 hidden h-[130%] w-auto text-white/[0.04] md:block" />
      <Container className="relative py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-steel-light">
            {t("kicker")}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-wide text-white sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink(t("whatsappMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants("onDark", "lg")}
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t("ctaPrimary")}
            </a>
            <Link href="/contact" className={buttonVariants("onDarkOutline", "lg")}>
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
