import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TriangleBullet } from "@/components/ui/icons";

/** The four fronts of the mentorship (CLAUDE.md §1): career strategy,
 *  LinkedIn optimization, interview prep and technical skill development. */
export async function HelpAreas() {
  const t = await getTranslations("mentorship.help");

  return (
    <section id="help" className="bg-canvas py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {([0, 1, 2, 3] as const).map((i) => (
            <div
              key={i}
              className="flex flex-col rounded-xl border border-navy/10 bg-white p-7 shadow-sm"
            >
              <span
                aria-hidden="true"
                className="text-xs font-bold uppercase tracking-[0.18em] text-steel"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-xl font-extrabold tracking-wide text-navy">
                {t(`items.${i}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">
                {t(`items.${i}.description`)}
              </p>
              <ul className="mt-5 space-y-2.5">
                {([0, 1, 2] as const).map((j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2.5 text-sm text-navy/85"
                  >
                    <TriangleBullet className="mt-1 h-2.5 w-2.5 shrink-0 text-accent" />
                    {t(`items.${i}.points.${j}`)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
