import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

type Props = { params: Promise<{ locale: string }> };

export default async function SignupPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.signup");

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <SignupForm
        labels={{
          name: t("name"),
          email: t("email"),
          password: t("password"),
          passwordHint: t("passwordHint"),
          submit: t("submit"),
          submitting: t("submitting"),
          errorInUse: t("errorInUse"),
          errorWeak: t("errorWeak"),
          errorGeneric: t("errorGeneric"),
        }}
      />
      <p className="mt-6 text-center text-sm text-steel">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-bold text-navy underline underline-offset-2 hover:text-accent-strong">
          {t("loginLink")}
        </Link>
      </p>
    </AuthCard>
  );
}
