import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ServiceNamespace } from "./types";

/** Navy band with six concrete outcomes this service line unlocks. */
export async function ServiceUseCases({ namespace }: { namespace: ServiceNamespace }) {
  const t = await getTranslations(`${namespace}.useCases`);

  return (
    <section className="bg-navy py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
          onDark
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {([0, 1, 2, 3, 4, 5] as const).map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-base font-extrabold tracking-wide text-white">
                {t(`items.${i}.title`)}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                {t(`items.${i}.description`)}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
