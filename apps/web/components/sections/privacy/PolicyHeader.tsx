import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { TriangleDivider } from "@/components/ui/TriangleDivider";

/** Page title, "last updated" line and plain-language intro (LGPD policy). */
export async function PolicyHeader() {
  const t = await getTranslations("privacy.header");

  return (
    <section className="bg-white pt-16 sm:pt-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent-ink">
            {t("kicker")}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-wide text-navy sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm text-steel">{t("lastUpdated")}</p>
          <div className="mt-6 space-y-4">
            {([0, 1] as const).map((i) => (
              <p
                key={i}
                className="text-base leading-relaxed text-steel sm:text-lg"
              >
                {t(`intro.${i}`)}
              </p>
            ))}
          </div>
          <TriangleDivider tone="steel" className="mt-8" />
        </div>
      </Container>
    </section>
  );
}
