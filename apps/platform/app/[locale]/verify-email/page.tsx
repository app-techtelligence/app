import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/auth/AuthCard";

type Props = { params: Promise<{ locale: string }> };

export default async function VerifyEmailPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.verify");

  return (
    <AuthCard title={t("title")}>
      <p className="text-sm leading-relaxed text-steel">{t("text")}</p>
      <p className="mt-6 text-center text-sm text-steel">
        <Link href="/login" className="font-bold text-navy underline underline-offset-2 hover:text-accent-strong">
          {t("back")}
        </Link>
      </p>
    </AuthCard>
  );
}
