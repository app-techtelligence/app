import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";
import { Hero } from "@/components/sections/consulting/Hero";
import { DataJourney } from "@/components/sections/consulting/DataJourney";
import { AiSolutions } from "@/components/sections/consulting/AiSolutions";
import { SoftwareSolutions } from "@/components/sections/consulting/SoftwareSolutions";
import { ProposalBand } from "@/components/sections/consulting/ProposalBand";

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
      <DataJourney />
      <AiSolutions />
      <SoftwareSolutions />
      <ProposalBand />
    </>
  );
}
