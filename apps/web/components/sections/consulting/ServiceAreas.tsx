import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon, TriangleBullet } from "@/components/ui/icons";

// The header's Consultoria dropdown scrolls here: each service block carries
// its own anchor (/consultoria#data, #ia, #software). The ids are
// locale-independent on purpose — one set of anchors serves both locales.
const services: { id: "data" | "ia" | "software"; key: "data" | "ai" | "software" }[] = [
  { id: "data", key: "data" },
  { id: "ia", key: "ai" },
  { id: "software", key: "software" },
];

export async function ServiceAreas() {
  const t = await getTranslations("consulting.serviceAreas");

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-12 space-y-8">
          {services.map(({ id, key }) => (
            <section
              key={id}
              id={id}
              data-reveal
              suppressHydrationWarning
              className="scroll-mt-24 rounded-xl border border-navy/10 bg-white p-7 shadow-sm sm:p-10"
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
                <h3 className="text-2xl font-extrabold tracking-wide text-navy">
                  {t(`${key}.title`)}
                </h3>
                <div>
                  <p className="text-sm leading-relaxed text-steel sm:text-base">
                    {t(`${key}.description`)}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {([0, 1, 2] as const).map((i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-navy/85">
                        <TriangleBullet className="mt-1 h-2.5 w-2.5 shrink-0 text-accent" />
                        {t(`${key}.items.${i}`)}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className="group mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-navy transition-colors hover:text-accent-strong"
                  >
                    {t("cta")}
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}
