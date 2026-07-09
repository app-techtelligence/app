import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";
import { Hero } from "@/components/sections/course/Hero";
import { WhoItsFor } from "@/components/sections/course/WhoItsFor";
import { Tracks } from "@/components/sections/course/Tracks";
import { Method } from "@/components/sections/course/Method";
import { TalentBridge } from "@/components/sections/shared/TalentBridge";
import { FinalCta } from "@/components/sections/course/FinalCta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "course", "/course");
}

export default async function CoursePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <WhoItsFor />
      <Tracks />
      <Method />
      <TalentBridge audience="students" />
      <FinalCta />
    </>
  );
}
