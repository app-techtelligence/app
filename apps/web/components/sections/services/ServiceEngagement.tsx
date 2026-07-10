import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ServiceNamespace } from "./types";

/** Three-step engagement path — same visual language as the consulting Approach. */
export async function ServiceEngagement({ namespace }: { namespace: ServiceNamespace }) {
  const t = await getTranslations(`${namespace}.engagement`);

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <ol className="mt-12 grid gap-8 sm:grid-cols-3 lg:gap-6">
          {([0, 1, 2] as const).map((i) => (
            <li key={i} className="border-t-2 border-accent pt-5">
              <span
                aria-hidden="true"
                className="text-sm font-extrabold tracking-[0.18em] text-accent-ink"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-lg font-extrabold tracking-wide text-navy">
                {t(`steps.${i}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                {t(`steps.${i}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
