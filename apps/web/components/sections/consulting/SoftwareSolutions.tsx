import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";

const cards = ["website", "store", "apps", "custom"] as const;

export async function SoftwareSolutions() {
  const t = await getTranslations("consulting");

  return (
    <section
      id="software"
      data-reveal
      suppressHydrationWarning
      className="scroll-mt-24 bg-white py-16 sm:py-20"
    >
      <Container>
        <SectionHeading
          align="left"
          kicker={t("software.kicker")}
          title={t("software.title")}
          subtitle={t("software.subtitle")}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {cards.map((key) => (
            <article
              key={key}
              className="flex flex-col rounded-xl border border-navy/10 bg-canvas p-7"
            >
              <h3 className="text-xl font-extrabold tracking-wide text-navy">
                {t(`software.cards.${key}.title`)}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-steel">
                {t(`software.cards.${key}.description`)}
              </p>
              <a
                href={whatsappLink(
                  t("whatsappTopic", { topic: t(`software.cards.${key}.title`) }),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants("secondary", "md", "mt-6 self-start")}
              >
                {t("software.cta")}
              </a>
            </article>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/contact" className={buttonVariants("primary", "lg")}>
            {t("software.proposalCta")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
