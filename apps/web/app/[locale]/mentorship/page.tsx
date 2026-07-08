import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";
import { Hero } from "@/components/sections/mentorship/Hero";
import { HelpAreas } from "@/components/sections/mentorship/HelpAreas";
import { Process } from "@/components/sections/mentorship/Process";
import { Credibility } from "@/components/sections/mentorship/Credibility";
import { FinalCta } from "@/components/sections/mentorship/FinalCta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "mentorship", "/mentorship");
}

export default async function MentorshipPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <HelpAreas />
      <Process />
      <Credibility />
      <FinalCta />
    </>
  );
}
