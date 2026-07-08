import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";
import { Hero } from "@/components/sections/consulting/Hero";
import { Services } from "@/components/sections/consulting/Services";
import { Approach } from "@/components/sections/consulting/Approach";
import { WhyUs } from "@/components/sections/consulting/WhyUs";
import { FinalCta } from "@/components/sections/consulting/FinalCta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "consulting", "/consulting");
}

export default async function ConsultingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Services />
      <Approach />
      <WhyUs />
      <FinalCta />
    </>
  );
}
