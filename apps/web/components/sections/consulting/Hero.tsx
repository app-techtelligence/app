import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";

export async function Hero() {
  const t = await getTranslations("consulting.hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy to-navy-deep">
      <Container className="relative py-20 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div data-reveal suppressHydrationWarning className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-steel-light">
              {t("kicker")}
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-wide text-white sm:text-5xl">
              {t("title")}
            </h1>
            <div className="mt-9">
              <a
                href={whatsappLink(t("whatsappMessage"))}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants("onDark", "lg")}
              >
                <WhatsAppIcon className="h-5 w-5" />
                {t("cta")}
              </a>
            </div>
          </div>
          {/* The brand peak as contour lines — the only illustration the page
              allows itself, drawn from the logo's geometry. */}
          <svg
            viewBox="0 0 340 300"
            fill="none"
            aria-hidden="true"
            className="hidden h-72 w-auto justify-self-end lg:block xl:h-80"
          >
            <path d="M170 16 L324 284 H16 Z" stroke="rgb(255 255 255 / 0.12)" strokeWidth="1.5" />
            <path d="M170 74 L288 278 H52 Z" stroke="rgb(255 255 255 / 0.2)" strokeWidth="1.5" />
            <path d="M170 132 L252 272 H88 Z" stroke="rgb(255 255 255 / 0.32)" strokeWidth="1.5" />
            <path d="M170 190 L216 266 H124 Z" stroke="rgb(255 255 255 / 0.5)" strokeWidth="1.5" fill="rgb(255 255 255 / 0.06)" />
          </svg>
        </div>
      </Container>
    </section>
  );
}
