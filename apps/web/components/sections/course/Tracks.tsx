import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

/*
 * PLACEHOLDER — pending client content (CLAUDE.md §10.6).
 * The full curriculum is still being defined with the client, so this section
 * presents the ROLES the course prepares for (capability outcomes), visibly
 * labeled as example tracks via the `disclaimer` badge below — no invented
 * module lists, hours or dates. Swap in the real curriculum when it lands.
 */
export async function Tracks() {
  const t = await getTranslations("course.tracks");

  return (
    <section className="bg-canvas py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <p className="mx-auto mt-6 w-fit rounded-full border border-navy/15 bg-white px-4 py-1.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-steel">
          {t("disclaimer")}
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {([0, 1, 2, 3, 4, 5, 6, 7] as const).map((i) => (
            <div
              key={i}
              className="rounded-xl border border-navy/10 bg-white p-7 shadow-sm"
            >
              <h3 className="text-lg font-extrabold tracking-wide text-navy">
                {t(`items.${i}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">
                {t(`items.${i}.text`)}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
