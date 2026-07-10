import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TriangleBullet } from "@/components/ui/icons";
import type { ServiceNamespace } from "./types";

/** Four offering cards — what this service line delivers in practice. */
export async function ServiceOfferings({ namespace }: { namespace: ServiceNamespace }) {
  const t = await getTranslations(`${namespace}.offerings`);

  return (
    <section className="bg-canvas py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {([0, 1, 2, 3] as const).map((card) => (
            <article
              key={card}
              className="flex flex-col rounded-xl border border-navy/10 bg-white p-7 shadow-sm"
            >
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
                {t(`cards.${card}.tagline`)}
              </span>
              <h3 className="mt-2 text-xl font-extrabold tracking-wide text-navy">
                {t(`cards.${card}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">
                {t(`cards.${card}.description`)}
              </p>
              <ul className="mt-5 space-y-2.5">
                {([0, 1, 2, 3] as const).map((i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-navy/85">
                    <TriangleBullet className="mt-1 h-2.5 w-2.5 shrink-0 text-accent" />
                    {t(`cards.${card}.items.${i}`)}
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
