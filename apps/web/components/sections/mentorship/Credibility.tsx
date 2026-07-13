import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { TriangleDivider } from "@/components/ui/TriangleDivider";

/** The credibility loop applied to mentorship: mentors build Data & AI
 *  for companies, so guidance reflects what the market actually hires for. */
export async function Credibility() {
  const t = await getTranslations("mentorship.credibility");

  return (
    <section className="bg-navy py-16 text-center sm:py-20">
      <Container className="flex flex-col items-center">
        <TriangleDivider tone="white" />
        <h2 className="mt-4 max-w-3xl text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          {t("text")}
        </p>
        <Link href="/about" className={buttonVariants("onDarkOutline", "md", "mt-8")}>
          {t("cta")}
        </Link>
      </Container>
    </section>
  );
}
