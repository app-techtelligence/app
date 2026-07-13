import { getTranslations } from "next-intl/server";
import { LogoMark } from "@/components/brand/LogoMark";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** The credibility loop story (CLAUDE.md §1) told as the company origin. */
export async function OurStory() {
  const t = await getTranslations("about.story");

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <SectionHeading
              kicker={t("kicker")}
              title={t("title")}
              align="left"
            />
            <div className="mt-6 max-w-2xl space-y-5">
              {([0, 1, 2] as const).map((i) => (
                <p key={i} className="text-base leading-relaxed text-navy/85">
                  {t(`paragraphs.${i}`)}
                </p>
              ))}
            </div>
          </div>

          {/* PLACEHOLDER — founder bio + photo pending (CLAUDE.md §10.5).
              Swap this card for the founder photo + personal story when the
              client provides them. Copy stays generic on purpose. */}
          <aside className="relative overflow-hidden rounded-xl bg-gradient-to-b from-navy to-navy-deep p-8 shadow-sm">
            <LogoMark className="pointer-events-none absolute -bottom-6 -right-8 h-36 w-auto text-white/[0.06]" />
            <div className="relative">
              <LogoMark className="h-10 w-auto text-steel-light" />
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-steel-light">
                {t("founder.kicker")}
              </p>
              <p className="mt-3 text-lg font-semibold leading-relaxed text-white">
                {t("founder.text")}
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
