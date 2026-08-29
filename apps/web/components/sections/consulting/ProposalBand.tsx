import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { LogoMark } from "@/components/brand/LogoMark";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";

/** Closing band: pricing is scoped per project, so the CTA is a conversation.
 *  Light surface by the owner's call — the navy stays in the hero only. */
export async function ProposalBand() {
  const t = await getTranslations("consulting.band");

  return (
    <section
      data-reveal
      suppressHydrationWarning
      className="bg-canvas py-16 text-center sm:py-20"
    >
      <Container className="flex flex-col items-center">
        <LogoMark className="h-10 w-auto text-navy" />
        <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed tracking-wide text-navy sm:text-xl">
          {t("text")}
        </p>
        <a
          href={whatsappLink(t("whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants("primary", "lg", "mt-9")}
        >
          <WhatsAppIcon className="h-5 w-5" />
          {t("cta")}
        </a>
      </Container>
    </section>
  );
}
