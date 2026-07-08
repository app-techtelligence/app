import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TriangleBullet } from "@/components/ui/icons";

const services = ["dataPlatforms", "aiEnvironments", "integrated"] as const;

export async function Services() {
  const t = await getTranslations("consulting.services");

  return (
    <section className="bg-canvas py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {services.map((key) => (
            <article
              key={key}
              className="flex flex-col rounded-xl border border-navy/10 bg-white p-7 shadow-sm"
            >
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
                {t(`${key}.tagline`)}
              </span>
              <h3 className="mt-2 text-xl font-extrabold tracking-wide text-navy">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">
                {t(`${key}.description`)}
              </p>
              <ul className="mt-5 space-y-2.5">
                {([0, 1, 2, 3] as const).map((i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-navy/85">
                    <TriangleBullet className="mt-1 h-2.5 w-2.5 shrink-0 text-accent" />
                    {t(`${key}.items.${i}`)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
