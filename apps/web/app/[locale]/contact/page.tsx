import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/metadata";
import { siteConfig, whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buttonVariants } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ContactForm } from "@/components/contact/ContactForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "contact", "/contact");
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  // The form is a client island — give it just its own namespace.
  const messages = await getMessages();

  return (
    <section className="bg-canvas py-16 sm:py-20">
      <Container>
        <SectionHeading
          as="h1"
          kicker={t("hero.kicker")}
          title={t("hero.title")}
          subtitle={t("hero.subtitle")}
        />

        <div className="mx-auto mt-12 grid max-w-4xl items-start gap-8 md:grid-cols-[2fr_3fr]">
          {/* WhatsApp is the primary channel — form is the fallback. */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-navy/10 bg-navy p-7 text-white shadow-sm">
              <h2 className="text-lg font-extrabold tracking-wide">
                {t("whatsapp.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                {t("whatsapp.text")}
              </p>
              <a
                href={whatsappLink(t("whatsapp.message"))}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants("primary", "md", "mt-5 w-full")}
              >
                <WhatsAppIcon className="h-4 w-4" />
                {t("whatsapp.cta")}
              </a>
            </div>

            <div className="rounded-xl border border-navy/10 bg-white p-7 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-steel">
                {t("email.title")}
              </h2>
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="mt-2 block break-all text-sm font-semibold text-navy hover:text-accent-strong"
              >
                {siteConfig.contactEmail}
              </a>
              <p className="mt-3 text-xs leading-relaxed text-steel">
                {t("email.note")}{" "}
                <Link href="/privacy" className="underline hover:text-navy">
                  {t("email.privacyLink")}
                </Link>
              </p>
            </div>
          </div>

          <NextIntlClientProvider messages={{ contact: messages.contact }}>
            <ContactForm />
          </NextIntlClientProvider>
        </div>
      </Container>
    </section>
  );
}
