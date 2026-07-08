import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/home/Hero";
import { ProductDoors } from "@/components/sections/home/ProductDoors";
import { CredibilityBand } from "@/components/sections/home/CredibilityBand";
import { FinalCta } from "@/components/sections/home/FinalCta";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ProductDoors />
      <CredibilityBand />
      <FinalCta />
    </>
  );
}
