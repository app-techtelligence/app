import { getTranslations } from "next-intl/server";
import { LogoMark } from "@/components/brand/LogoMark";
import { Container } from "@/components/ui/Container";

/**
 * Lighter hero than the product pages on purpose — the About page is
 * narrative, so canvas + navy text sets a calmer, editorial tone.
 */
export async function AboutHero() {
  const t = await getTranslations("about.hero");

  return (
    <section className="relative overflow-hidden bg-canvas">
      <LogoMark className="pointer-events-none absolute -right-16 -top-10 hidden h-[130%] w-auto text-navy/[0.04] md:block" />
      <Container className="relative py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent-ink">
            {t("kicker")}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-wide text-navy sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-steel">
            {t("subtitle")}
          </p>
        </div>
      </Container>
    </section>
  );
}
