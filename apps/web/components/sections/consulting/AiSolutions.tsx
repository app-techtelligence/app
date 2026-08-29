import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";

const rows = ["chatbot", "marketing", "processes", "recruiting", "sales"] as const;

/**
 * One elevated panel with dividing rules instead of five identical cards:
 * the automations read as a catalog you scan down, not a grid you decode.
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
        <div className="mt-12 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm shadow-navy/5">
          <ul className="divide-y divide-navy/10">
            {rows.map((key) => (
              <li key={key}>
                <div className="grid gap-4 p-6 transition-colors hover:bg-canvas sm:p-7 lg:grid-cols-[260px_minmax(0,1fr)_auto] lg:items-center lg:gap-8">
                  <h3 className="text-lg font-extrabold tracking-wide text-navy">
                    {t(`ai.cards.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-steel">
                    {t(`ai.cards.${key}.description`)}
                  </p>
                  <a
                    href={whatsappLink(
                      t("whatsappTopic", { topic: t(`ai.cards.${key}.title`) }),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants("secondary", "md", "justify-self-start lg:justify-self-end")}
                  >
                    {t("ai.cta")}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
