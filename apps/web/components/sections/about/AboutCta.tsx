import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";

export async function AboutCta() {
  const t = await getTranslations("about.finalCta");

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container className="flex flex-col items-center text-center">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappLink(t("whatsappMessage"))}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants("primary", "lg")}
          >
            <WhatsAppIcon className="h-5 w-5" />
            {t("ctaWhatsapp")}
          </a>
          <Link href="/contact" className={buttonVariants("outline", "lg")}>
            {t("ctaContact")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
