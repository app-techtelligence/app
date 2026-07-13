import { getLocale, getTranslations } from "next-intl/server";
import { platformLoginUrl } from "@/lib/site-config";
import { LogoMark } from "@/components/brand/LogoMark";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";

export async function Hero() {
  const t = await getTranslations("course.hero");
  const locale = await getLocale();

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
              href={platformLoginUrl(locale)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants("onDark", "lg")}
            >
              {t("ctaPrimary")}
              <ArrowRightIcon className="h-5 w-5" />
            </a>
            <a href="#for-whom" className={buttonVariants("onDarkOutline", "lg")}>
              {t("ctaSecondary")}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
