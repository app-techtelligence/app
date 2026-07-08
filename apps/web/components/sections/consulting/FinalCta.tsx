import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";
import { TriangleDivider } from "@/components/ui/TriangleDivider";
import { WhatsAppIcon } from "@/components/ui/icons";

export async function FinalCta() {
  const t = await getTranslations("consulting.finalCta");

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container className="flex flex-col items-center text-center">
        <TriangleDivider tone="accent" className="mb-4" />
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappLink(t("whatsappMessage"))}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants("primary", "lg")}
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t("ctaPrimary")}
          </a>
          <Link href="/contact" className={buttonVariants("outline", "lg")}>
            {t("ctaSecondary")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
