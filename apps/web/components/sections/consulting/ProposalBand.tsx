import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { LogoMark } from "@/components/brand/LogoMark";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";

/** Closing band: pricing is scoped per project, so the CTA is a conversation.
 *  The mark sits above the statement — the summit of the page's climb. */
export async function ProposalBand() {
  const t = await getTranslations("consulting.band");

  return (
    <section
      data-reveal
      suppressHydrationWarning
      className="bg-navy py-16 text-center sm:py-20"
    >
      <Container className="flex flex-col items-center">
        <LogoMark className="h-10 w-auto text-white/90" />
        <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed tracking-wide text-white sm:text-xl">
          {t("text")}
        </p>
        <a
          href={whatsappLink(t("whatsappMessage"))}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants("onDark", "lg", "mt-9")}
        >
          <WhatsAppIcon className="h-5 w-5" />
          {t("cta")}
        </a>
      </Container>
    </section>
  );
}
