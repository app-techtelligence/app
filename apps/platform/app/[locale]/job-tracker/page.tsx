import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { JobApplication } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import {
  JobTrackerBoard,
  type JobTrackerLabels,
} from "@/components/job-tracker/JobTrackerBoard";

type Props = { params: Promise<{ locale: string }> };

export default async function JobTrackerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("jobTracker");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  // RLS already scopes the select to the caller's own rows.
  const { data: applications, error } = await supabase
    .from("job_applications")
    .select(
      "id, user_id, company_name, contact_name, website_url, salary, first_contact_date, stage, status, created_at",
    )
    .order("created_at");

  // The board is a Client Component; the layout's NextIntlClientProvider only
  // ships the `common` namespace, so its strings travel as props instead.
  const labels: JobTrackerLabels = {
    newApplication: t("newApplication"),
    create: t("create"),
    cancel: t("cancel"),
    save: t("save"),
    saving: t("saving"),
    errorSave: t("errorSave"),
    edit: t("edit"),
    close: t("close"),
    delete: t("delete"),
    confirmDelete: t("confirmDelete"),
    moveBack: t("moveBack"),
    moveForward: t("moveForward"),
    toggleStatus: t("toggleStatus"),
    openWebsite: t("openWebsite"),
    empty: t("empty"),
    fields: {
      companyName: t("fields.companyName"),
      contactName: t("fields.contactName"),
      websiteUrl: t("fields.websiteUrl"),
      websiteUrlPlaceholder: t("fields.websiteUrlPlaceholder"),
      salary: t("fields.salary"),
      salaryPlaceholder: t("fields.salaryPlaceholder"),
      firstContactDate: t("fields.firstContactDate"),
      stage: t("fields.stage"),
      status: t("fields.status"),
    },
    stages: {
      first_contact: t("stages.firstContact"),
      hr_interview: t("stages.hrInterview"),
      tech_interview: t("stages.techInterview"),
      manager_interview: t("stages.managerInterview"),
      offer: t("stages.offer"),
    },
    statuses: {
      waiting: t("statuses.waiting"),
      no_return: t("statuses.noReturn"),
    },
  };

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-wide text-navy">
        {t("title")}
      </h1>
      <p className="mt-2 text-steel">{t("subtitle")}</p>

      {error ? (
        // The table may not exist yet (migration 0007 pending) — degrade to a
        // notice instead of a hard error.
        <p className="mt-10 rounded-md bg-accent/10 px-4 py-3 text-sm font-medium text-accent-ink">
          {t("unavailable")}
        </p>
      ) : (
        <JobTrackerBoard
          initial={(applications ?? []) as JobApplication[]}
          labels={labels}
          locale={locale}
        />
      )}
    </Container>
  );
}
