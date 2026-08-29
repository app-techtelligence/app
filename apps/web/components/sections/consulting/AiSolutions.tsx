import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";

const cards = ["chatbot", "marketing", "processes", "recruiting", "sales"] as const;

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
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {cards.map((key) => (
            <article
              key={key}
              className="flex flex-col rounded-xl border border-navy/10 bg-white p-7 shadow-sm"
            >
              <h3 className="text-xl font-extrabold tracking-wide text-navy">
                {t(`ai.cards.${key}.title`)}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-steel">
                {t(`ai.cards.${key}.description`)}
              </p>
              <a
                href={whatsappLink(
                  t("whatsappTopic", { topic: t(`ai.cards.${key}.title`) }),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants("secondary", "md", "mt-6 self-start")}
              >
                {t("ai.cta")}
              </a>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
