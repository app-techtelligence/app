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
  return pageMetadata(locale, "serviceDataGovernance", "/consulting/data-governance");
}

export default async function DataGovernanceServicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <ServiceHero namespace="serviceDataGovernance" />
      <ServiceOfferings namespace="serviceDataGovernance" />
      <ServiceUseCases namespace="serviceDataGovernance" />
      <ServiceEngagement namespace="serviceDataGovernance" />
      <ServiceFinalCta namespace="serviceDataGovernance" />
    </>
  );
}
