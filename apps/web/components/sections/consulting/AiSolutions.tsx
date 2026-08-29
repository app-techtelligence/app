import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon } from "@/components/ui/icons";

const cards = ["chatbot", "marketing", "processes", "recruiting", "sales"] as const;

/**
 * iOS-style cards (owner's call): generous corner radius, hairline border,
 * soft diffuse shadow, whole card tappable. Laid 2-up then 3-up so five
 * items close the grid with no orphan cell (the 5th goes full-width in the
 * tablet two-column window).
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
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {cards.map((key, i) => (
            <a
              key={key}
              href={whatsappLink(
                t("whatsappTopic", { topic: t(`ai.cards.${key}.title`) }),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col rounded-2xl border border-navy/5 bg-white p-7 shadow-md shadow-navy/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10 ${
                i < 2 ? "lg:col-span-3" : "lg:col-span-2"
              } ${i === cards.length - 1 ? "sm:col-span-2 lg:col-span-2" : ""}`}
            >
              <h3 className="text-xl font-extrabold tracking-wide text-navy">
                {t(`ai.cards.${key}.title`)}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-steel">
                {t(`ai.cards.${key}.description`)}
              </p>
              <span className="mt-6 flex items-center gap-1.5 text-sm font-bold text-navy transition-colors group-hover:text-accent-strong">
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
