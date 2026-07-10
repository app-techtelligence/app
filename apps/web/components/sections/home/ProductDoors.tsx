import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon, TriangleBullet } from "@/components/ui/icons";

const doors: { href: AppPathname; key: "consulting" | "course" | "mentorship" }[] = [
  { href: "/consulting", key: "consulting" },
  { href: "/course", key: "course" },
  { href: "/mentorship", key: "mentorship" },
];

export async function ProductDoors() {
  const t = await getTranslations("home.doors");

  return (
    <section id="solutions" className="bg-canvas py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {doors.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              className="group flex flex-col rounded-xl border border-navy/10 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
                {t(`${key}.tagline`)}
              </span>
              <h3 className="mt-2 text-xl font-extrabold tracking-wide text-navy">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-steel">
                {t(`${key}.description`)}
              </p>
              <ul className="mt-5 space-y-2.5">
                {([0, 1, 2] as const).map((i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-navy/85">
                    <TriangleBullet className="mt-1 h-2.5 w-2.5 shrink-0 text-accent" />
                    {t(`${key}.items.${i}`)}
                  </li>
                ))}
              </ul>
              <span className="mt-auto flex items-center gap-1.5 pt-6 text-sm font-bold text-navy transition-colors group-hover:text-accent-strong">
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
