import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";

export async function FinalCta() {
  const t = await getTranslations("home.finalCta");

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container className="flex flex-col items-center text-center">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />
        <a
          href={whatsappLink(t("whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants("primary", "lg", "mt-8")}
        >
          <WhatsAppIcon className="h-5 w-5" />
          {t("cta")}
        </a>
      </Container>
    </section>
  );
}
