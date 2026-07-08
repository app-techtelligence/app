import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";

type Props = { params: Promise<{ locale: string }> };

export default async function ConsultingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common.nav");

  return (
    <Container className="py-24">
      <h1 className="text-3xl font-extrabold tracking-wide">{t("consulting")}</h1>
    </Container>
  );
}
