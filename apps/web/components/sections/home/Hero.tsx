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
        <div className="relative max-w-2xl">
          {/* AA substrate. The field crests at rgb(214,241,247) — white text on
              that is 1.2:1, and over one cycle a crest crosses 14% of this box.
              Feathered to the copy so the field keeps full intensity everywhere
              it isn't holding up text. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-24 -inset-y-10 bg-gradient-to-b from-navy/94 to-navy-deep/94"
            style={{
              // Each gradient reaches black 1rem short of the inset, so the
              // opaque core overshoots the copy box and glyph ink can never
              // land in the falloff.
              maskImage:
                "linear-gradient(to right, transparent, black 5rem, black calc(100% - 5rem), transparent)," +
                "linear-gradient(to bottom, transparent, black 1.5rem, black calc(100% - 1.5rem), transparent)",
              maskComposite: "intersect",
            }}
          />
          <div className="relative">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-signal">
              {t("kicker")}
            </p>
            <h1 className="display-expanded mt-6 text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
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
              <a href="#solutions" className={buttonVariants("onDarkOutline", "lg")}>
                {t("ctaSecondary")}
              </a>
            </div>
            <ProofStrip />
          </div>
        </div>
      </Container>
    </section>
  );
}
