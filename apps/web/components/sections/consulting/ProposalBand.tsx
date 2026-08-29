import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { TriangleDivider } from "@/components/ui/TriangleDivider";
import { WhatsAppIcon } from "@/components/ui/icons";

/** Closing band: pricing is scoped per project, so the CTA is a conversation. */
export async function ProposalBand() {
  const t = await getTranslations("consulting.band");

  return (
    <section
      data-reveal
      suppressHydrationWarning
      className="bg-navy py-16 text-center sm:py-20"
    >
      <Container className="flex flex-col items-center">
        <TriangleDivider tone="white" />
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          {t("text")}
        </p>
        <a
          href={whatsappLink(t("whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants("onDark", "lg", "mt-8")}
        >
          <WhatsAppIcon className="h-5 w-5" />
          {t("cta")}
        </a>
      </Container>
    </section>
  );
}
