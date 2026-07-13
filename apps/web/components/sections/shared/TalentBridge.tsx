import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { StaticAppPathname } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { TriangleBullet } from "@/components/ui/icons";

type TalentBridgeProps = {
  /**
   * "students": on Course/Mentorship pages — standing out can lead to real
   * consultancy projects. "clients": on Consulting — projects can be staffed
   * with professionals trained and vetted in our own programs.
   */
  audience: "students" | "clients";
};

const ctaHref: Record<TalentBridgeProps["audience"], StaticAppPathname> = {
  students: "/consulting",
  clients: "/course",
};

/** The talent flywheel: training and consulting feeding each other. */
export async function TalentBridge({ audience }: TalentBridgeProps) {
  const t = await getTranslations(`talentBridge.${audience}`);

  return (
    <section className="bg-canvas py-16 sm:py-20">
      <Container className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-accent-ink">
            {t("kicker")}
          </p>
          <h2 className="text-3xl font-extrabold tracking-wide text-navy sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-steel sm:text-lg">
            {t("text")}
          </p>
          <Link
            href={ctaHref[audience]}
            className={buttonVariants("secondary", "md", "mt-7")}
          >
            {t("cta")}
          </Link>
        </div>

        <ul className="space-y-4 rounded-xl border border-navy/10 bg-white p-7 shadow-sm sm:p-8">
          {([0, 1, 2] as const).map((i) => (
            <li key={i} className="flex items-start gap-3">
              <TriangleBullet className="mt-1.5 h-3 w-3 shrink-0 text-accent" />
              <div>
                <h3 className="text-sm font-extrabold tracking-wide text-navy">
                  {t(`items.${i}.title`)}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-steel">
                  {t(`items.${i}.text`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
