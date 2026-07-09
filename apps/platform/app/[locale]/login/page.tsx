import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ confirmed?: string; error?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.login");
  const { confirmed, error } = await searchParams;

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      {confirmed ? (
        <p
          role="status"
          className="mb-5 rounded-md bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800"
        >
          {t("confirmedBanner")}
        </p>
      ) : null}
      {error === "confirm" ? (
        <p
          role="alert"
          className="mb-5 rounded-md bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800"
        >
          {t("confirmFailedBanner")}
        </p>
      ) : null}
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
