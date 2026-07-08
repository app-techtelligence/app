import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TriangleBullet } from "@/components/ui/icons";

export async function ValuesGrid() {
  const t = await getTranslations("about.values");

  return (
    <section className="bg-canvas py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {([0, 1, 2, 3] as const).map((i) => (
            <div
              key={i}
              className="rounded-xl border border-navy/10 bg-white p-7 shadow-sm"
            >
              <TriangleBullet
                className="h-3.5 w-3.5 text-accent"
              />
              <h3 className="mt-4 text-lg font-extrabold tracking-wide text-navy">
                {t(`items.${i}.title`)}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-steel">
                {t(`items.${i}.description`)}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
