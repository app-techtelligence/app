import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon } from "@/components/ui/icons";

const cards = ["chatbot", "marketing", "processes", "recruiting", "sales"] as const;

/**
 * Owner's call: a left-aligned vertical stack, every card the same size
 * regardless of copy length — distinct from the Software grid below. Same
 * iOS family: generous radius, hairline border, soft shadow, whole card
 * tappable.
 */
export async function AiSolutions() {
  const t = await getTranslations("consulting");

  return (
    <section
      id="ia"
      data-reveal
      suppressHydrationWarning
      className="scroll-mt-24 bg-canvas py-16 sm:py-20"
    >
      <Container>
        <SectionHeading
          align="left"
          kicker={t("ai.kicker")}
          title={t("ai.title")}
          subtitle={t("ai.subtitle")}
        />
        <div className="mt-12 flex max-w-3xl flex-col gap-5">
          {cards.map((key) => (
            <a
              key={key}
              href={whatsappLink(
                t("whatsappTopic", { topic: t(`ai.cards.${key}.title`) }),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full flex-col rounded-2xl border border-navy/5 bg-white p-7 shadow-md shadow-navy/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10"
            >
              <h3 className="text-xl font-extrabold tracking-wide text-navy">
                {t(`ai.cards.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                {t(`ai.cards.${key}.description`)}
              </p>
              <span className="mt-5 flex items-center gap-1.5 text-sm font-bold text-navy transition-colors group-hover:text-accent-strong">
                {t("ai.cta")}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
