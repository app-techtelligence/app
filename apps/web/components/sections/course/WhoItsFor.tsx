import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TriangleBullet } from "@/components/ui/icons";

export async function WhoItsFor() {
  const t = await getTranslations("course.whoFor");
  // Data-driven so we can widen the funnel (add audiences) without touching this
  // component — new personas just get appended in both locale message files.
  const personas = t.raw("personas") as { title: string; text: string }[];

  return (
    <section id="for-whom" className="bg-white py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona, i) => (
            <div
              key={i}
              className="rounded-xl border border-navy/10 bg-white p-7 shadow-sm"
            >
              <TriangleBullet className="h-3.5 w-3.5 text-accent" />
              <h3 className="mt-4 text-lg font-extrabold tracking-wide text-navy">
                {persona.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">
                {persona.text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
