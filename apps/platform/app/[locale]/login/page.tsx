import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.login");

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <LoginForm
        labels={{
          email: t("email"),
          password: t("password"),
          submit: t("submit"),
          submitting: t("submitting"),
          errorInvalid: t("errorInvalid"),
          errorUnconfirmed: t("errorUnconfirmed"),
          errorGeneric: t("errorGeneric"),
        }}
      />
      <p className="mt-6 text-center text-sm text-steel">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-bold text-navy underline underline-offset-2 hover:text-accent-strong">
          {t("signupLink")}
        </Link>
      </p>
    </AuthCard>
  );
}
