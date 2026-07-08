import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";
import { AboutHero } from "@/components/sections/about/AboutHero";
import { OurStory } from "@/components/sections/about/OurStory";
import { ValuesGrid } from "@/components/sections/about/ValuesGrid";
import { EcosystemBand } from "@/components/sections/about/EcosystemBand";
import { AboutCta } from "@/components/sections/about/AboutCta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "about", "/about");
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AboutHero />
      <OurStory />
      <ValuesGrid />
      <EcosystemBand />
      <AboutCta />
    </>
  );
}
