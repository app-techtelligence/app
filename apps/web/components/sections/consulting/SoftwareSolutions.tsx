import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";

const cards = ["website", "store", "apps", "custom"] as const;

/** Same iOS-style card family as the AI section: generous radius, hairline
 *  border, soft shadow, whole card tappable. */
export async function SoftwareSolutions() {
  const t = await getTranslations("consulting");

  return (
    <section
      id="software"
      data-reveal
      suppressHydrationWarning
      className="scroll-mt-24 bg-canvas py-16 sm:py-20"
    >
      <Container>
        <SectionHeading
          align="left"
          kicker={t("software.kicker")}
          title={t("software.title")}
          subtitle={t("software.subtitle")}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {cards.map((key) => (
            <a
              key={key}
              href={whatsappLink(
                t("whatsappTopic", { topic: t(`software.cards.${key}.title`) }),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl border border-navy/5 bg-white p-7 shadow-md shadow-navy/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10"
            >
              <h3 className="text-xl font-extrabold tracking-wide text-navy">
                {t(`software.cards.${key}.title`)}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-steel">
                {t(`software.cards.${key}.description`)}
              </p>
              <span className="mt-6 flex items-center gap-1.5 text-sm font-bold text-navy transition-colors group-hover:text-accent-strong">
                {t("software.cta")}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/contact" className={buttonVariants("primary", "lg")}>
            {t("software.proposalCta")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
