import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CheckIcon } from "@/components/ui/icons";

/*
 * PLACEHOLDER — pending client content: proof points (past projects,
 * technologies used, publicly quotable client names) will be added here
 * once provided (CLAUDE.md §10.7). Until then this section states only
 * verifiable differentiators — no invented cases, logos or numbers.
 */
export async function WhyUs() {
  const t = await getTranslations("consulting.whyUs");

  return (
    <section className="bg-navy py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
          onDark
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {([0, 1, 2, 3] as const).map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15">
                <CheckIcon className="h-5 w-5 text-accent" />
              </span>
              <div>
                <h3 className="text-base font-extrabold tracking-wide text-white">
                  {t(`items.${i}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                  {t(`items.${i}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
