import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";

/** The credibility loop applied to the course (CLAUDE.md §1). */
export async function Method() {
  const t = await getTranslations("course.method");

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              kicker={t("kicker")}
              title={t("title")}
              align="left"
            />
            <p className="mt-5 max-w-xl text-base leading-relaxed text-steel sm:text-lg">
              {t("text")}
            </p>
            <Link href="/about" className={buttonVariants("secondary", "md", "mt-8")}>
              {t("cta")}
            </Link>
          </div>
          <ul className="space-y-6">
            {([0, 1, 2, 3] as const).map((i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15">
                  <CheckIcon className="h-5 w-5 text-accent-strong" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold tracking-wide text-navy">
                    {t(`items.${i}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-steel">
                    {t(`items.${i}.text`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
