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
            <article
              key={key}
              className="flex w-full flex-col rounded-2xl border border-navy/5 bg-white p-7 shadow-md shadow-navy/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10"
            >
              <h3 className="text-xl font-extrabold tracking-wide text-navy">
                {t(`ai.cards.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                {t(`ai.cards.${key}.description`)}
              </p>
              <a
                href={whatsappLink(
                  t("whatsappTopic", { topic: t(`ai.cards.${key}.title`) }),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link mt-5 flex items-center gap-1.5 self-start text-sm font-bold text-navy transition-colors hover:text-accent-strong"
              >
                {t("ai.cta")}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
              </a>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
