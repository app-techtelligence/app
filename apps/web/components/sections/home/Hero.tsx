import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ContourField } from "./ContourField";
import { ProofStrip } from "./ProofStrip";

export async function Hero() {
  const t = await getTranslations("home.hero");

  return (
    // `on-navy` switches :focus-visible to the signal ring; the gradient is a
    // complete background on its own, so the canvas is free to not render.
    <section className="on-navy relative isolate overflow-hidden bg-gradient-to-b from-navy to-navy-deep">
      <ContourField />
      <Container className="relative z-10 py-20 sm:py-28">
        {/* No scrim: the field stays at full intensity across the whole section
            and every piece of copy carries its own halo instead. The filled CTA
            is the one exception — its label is navy on white, where a navy halo
            would only smudge. */}
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-signal text-shadow-halo-sm">
            {t("kicker")}
          </p>
          <h1 className="display-expanded mt-6 text-4xl font-extrabold leading-[1.04] tracking-tight text-white text-shadow-halo sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75 text-shadow-halo">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink(t("whatsappMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants("onDark", "lg")}
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t("ctaPrimary")}
            </a>
            <a
              href="#solutions"
              className={`${buttonVariants("onDarkOutline", "lg")} text-shadow-halo`}
            >
              {t("ctaSecondary")}
            </a>
          </div>
          <ProofStrip />
        </div>
      </Container>
    </section>
  );
}
