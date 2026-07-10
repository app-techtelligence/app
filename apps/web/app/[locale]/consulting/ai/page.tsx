import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";
import { ServiceHero } from "@/components/sections/services/ServiceHero";
import { ServiceOfferings } from "@/components/sections/services/ServiceOfferings";
import { ServiceUseCases } from "@/components/sections/services/ServiceUseCases";
import { ServiceEngagement } from "@/components/sections/services/ServiceEngagement";
import { ServiceFinalCta } from "@/components/sections/services/ServiceFinalCta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "serviceAi", "/consulting/ai");
}

export default async function AiServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <ServiceHero namespace="serviceAi" />
      <ServiceOfferings namespace="serviceAi" />
      <ServiceUseCases namespace="serviceAi" />
      <ServiceEngagement namespace="serviceAi" />
      <ServiceFinalCta namespace="serviceAi" />
    </>
  );
}
