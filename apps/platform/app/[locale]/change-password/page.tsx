import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

type Props = { params: Promise<{ locale: string }> };

export default async function ChangePasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.password");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect({ href: "/login", locale });
    return null;
  }

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <ChangePasswordForm
        email={user.email}
        labels={{
          current: t("current"),
          new: t("new"),
          confirm: t("confirm"),
          hint: t("hint"),
          submit: t("submit"),
          submitting: t("submitting"),
          success: t("success"),
          errorWrongCurrent: t("errorWrongCurrent"),
          errorWeak: t("errorWeak"),
          errorMismatch: t("errorMismatch"),
          errorSame: t("errorSame"),
          errorGeneric: t("errorGeneric"),
        }}
      />
      <p className="mt-6 text-center text-sm text-steel">
        <Link
          href="/dashboard"
          className="font-bold text-navy underline underline-offset-2 hover:text-accent-strong"
        >
          {t("back")}
        </Link>
      </p>
    </AuthCard>
  );
}
