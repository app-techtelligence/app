import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";
import { TriangleBullet, WhatsAppIcon } from "@/components/ui/icons";

// The three stages sell separately or as a journey; `items` is how many
// entries each step has in the messages (index access keeps every string in
// messages/*.json — same pattern as home/ProductDoors.tsx).
const steps = [
  { key: "diagnosis", items: 4 },
  { key: "build", items: 5 },
  { key: "squad", items: 4 },
] as const;

/**
 * The journey drawn as a route: a continuous rail with triangle waypoints,
 * because these stages ARE a sequence — the numbering carries information,
 * it does not decorate. The rail is this page's signature element.
 */
export async function DataJourney() {
  const t = await getTranslations("consulting");

  return (
    // scroll-mt clears the sticky h-16 header when the nav anchor lands here.
    <section
      id="data"
      data-reveal
      suppressHydrationWarning
      className="scroll-mt-24 bg-white py-16 sm:py-20"
    >
      <Container>
        <SectionHeading
          align="left"
          kicker={t("data.kicker")}
          title={t("data.title")}
          subtitle={t("data.subtitle")}
        />
        <ol className="mt-12 sm:mt-14">
          {steps.map(({ key, items }) => (
            <li key={key} className="group/step flex gap-5 sm:gap-8">
              {/* Rail: waypoint marker + connecting line, running the full
                  length of every stage — the last one included. */}
              <div aria-hidden="true" className="flex flex-col items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-navy/15 bg-white shadow-sm shadow-navy/5">
                  <TriangleBullet className="h-3.5 w-3.5 text-navy" />
                </span>
                <span className="w-px flex-1 bg-navy/15" />
              </div>
              <div className="pb-12 group-last/step:pb-0 sm:pb-14">
                <p className="pt-2.5 text-xs font-bold uppercase tracking-[0.18em] text-steel">
                  {t(`data.steps.${key}.label`)}
                </p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-wide text-navy sm:text-3xl">
                  {t(`data.steps.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm italic leading-relaxed text-steel sm:text-base">
                  {t(`data.steps.${key}.tag`)}
                </p>
                <ul className="mt-5 max-w-2xl space-y-2.5">
                  {Array.from({ length: items }, (_, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-navy/85">
                      <TriangleBullet className="mt-1 h-2.5 w-2.5 shrink-0 text-accent" />
                      {t(`data.steps.${key}.items.${i}`)}
                    </li>
                  ))}
                </ul>
                <a
                  href={whatsappLink(
                    t("whatsappTopic", { topic: t(`data.steps.${key}.title`) }),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants("primary", "md", "mt-7")}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {t(`data.steps.${key}.cta`)}
                </a>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
