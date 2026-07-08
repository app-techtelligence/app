import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TriangleBullet } from "@/components/ui/icons";

/** Three-step process. Formats stay flexible on purpose — no fixed
 *  durations or prices are promised anywhere on this page. */
export async function Process() {
  const t = await getTranslations("mentorship.process");

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {([0, 1, 2] as const).map((i) => (
            <li key={i} className="flex flex-col">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-base font-extrabold text-white"
              >
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-extrabold tracking-wide text-navy">
                {t(`steps.${i}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                {t(`steps.${i}.description`)}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex justify-center">
          <p className="flex max-w-2xl items-start gap-2.5 rounded-lg border border-navy/10 bg-canvas px-6 py-4 text-sm leading-relaxed text-navy/85">
            <TriangleBullet className="mt-1 h-2.5 w-2.5 shrink-0 text-accent" />
            {t("note")}
          </p>
        </div>
      </Container>
    </section>
  );
}
