import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { StaticAppPathname } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TriangleDivider } from "@/components/ui/TriangleDivider";
import { ArrowRightIcon } from "@/components/ui/icons";

const products: { href: StaticAppPathname; key: "consulting" | "course" | "mentorship" }[] = [
  { href: "/consulting", key: "consulting" },
  { href: "/course", key: "course" },
  { href: "/mentorship", key: "mentorship" },
];

/** The three products presented as one ecosystem fed by the same practice. */
export async function EcosystemBand() {
  const t = await getTranslations("about.ecosystem");

  return (
    <section className="bg-navy py-16 sm:py-20">
      <Container>
        <TriangleDivider tone="accent" className="mb-4" />
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
          onDark
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {products.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              className="group flex flex-col rounded-xl border border-white/15 bg-white/5 p-7 transition-colors hover:border-white/30 hover:bg-white/10"
            >
              <h3 className="text-xl font-extrabold tracking-wide text-white">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                {t(`${key}.description`)}
              </p>
              <span className="mt-auto flex items-center gap-1.5 pt-6 text-sm font-bold text-accent">
                {t(`${key}.cta`)}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
