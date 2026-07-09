import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";
import { Hero } from "@/components/sections/home/Hero";
import { ProductDoors } from "@/components/sections/home/ProductDoors";
import { CredibilityBand } from "@/components/sections/home/CredibilityBand";
import { ClientLogos } from "@/components/sections/shared/ClientLogos";
import { FinalCta } from "@/components/sections/home/FinalCta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "home", "/");
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ProductDoors />
      <CredibilityBand />
      <ClientLogos variant="strip" />
      <FinalCta />
    </>
  );
}
