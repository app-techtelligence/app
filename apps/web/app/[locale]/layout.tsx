import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Archivo, IBM_Plex_Mono, Manrope } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

// Variable font: omitting `weight` keeps the full range, and `axes` opts into
// the width axis so headings can be set at wdth 122 (spec §4).
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

// Static family — the two weights actually used are requested explicitly.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Enables static rendering — every page below also calls this.
  setRequestLocale(locale);

  // Only the "common" namespace goes to the client (nav, locale switcher);
  // sending all messages would serialize the full tree into every page.
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${manrope.variable} ${archivo.variable} ${plexMono.variable}`}
    >
      <body className="flex min-h-svh flex-col font-sans antialiased">
        <NextIntlClientProvider messages={{ common: messages.common }}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloat />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
