import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { platformLoginUrl } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { TriangleDivider } from "@/components/ui/TriangleDivider";
import { ArrowRightIcon } from "@/components/ui/icons";

export async function FinalCta() {
  const t = await getTranslations("course.finalCta");
  const locale = await getLocale();

  return (
    <section className="bg-navy py-16 text-center sm:py-20">
      <Container className="flex flex-col items-center">
        <TriangleDivider tone="accent" />
        <h2 className="mt-4 max-w-3xl text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          {t("subtitle")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={platformLoginUrl(locale)}
            className={buttonVariants("primary", "lg")}
          >
            {t("ctaPrimary")}
            <ArrowRightIcon className="h-5 w-5" />
          </a>
          <Link href="/contact" className={buttonVariants("onDark", "lg")}>
            {t("ctaSecondary")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
