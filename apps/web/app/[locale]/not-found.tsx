import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";

export default function NotFoundPage() {
  const t = useTranslations("common.notFound");

  return (
    <Container className="flex flex-col items-center py-24 text-center">
      <p className="text-6xl font-extrabold tracking-wide text-navy/15">404</p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-wide text-navy">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-steel">{t("description")}</p>
      <Link href="/" className={buttonVariants("primary", "md", "mt-8")}>
        {t("back")}
      </Link>
    </Container>
  );
}
