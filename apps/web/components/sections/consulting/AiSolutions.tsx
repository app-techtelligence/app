import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";
import { TriangleBullet } from "@/components/ui/icons";

const cards = ["chatbot", "marketing", "processes", "recruiting", "sales"] as const;

/**
 * One card family, laid 2-up then 3-up so five items close the grid with no
 * orphan cell (the 5th also goes full-width in the tablet 2-column window).
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
            <article
              key={key}
              className={`flex flex-col rounded-xl border border-navy/10 bg-white p-7 shadow-sm shadow-navy/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-md hover:shadow-navy/10 ${
                i < 2 ? "lg:col-span-3" : "lg:col-span-2"
              } ${i === cards.length - 1 ? "sm:col-span-2 lg:col-span-2" : ""}`}
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5"
              >
                <TriangleBullet className="h-3.5 w-3.5 text-navy" />
              </span>
              <h3 className="mt-4 text-xl font-extrabold tracking-wide text-navy">
                {t(`ai.cards.${key}.title`)}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-steel">
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
