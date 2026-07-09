import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getAdminContext } from "@/lib/admin";
import { createCourse } from "@/lib/admin-actions";
import type { Course } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";

type Props = { params: Promise<{ locale: string }> };

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy focus:border-navy";

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const ctx = await getAdminContext();
  if (!ctx) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const { data: courses } = await ctx.supabase
    .from("courses")
    .select(
      "id, slug, title, title_en, description, description_en, is_published, beta_open",
    )
    .order("created_at");

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-wide text-navy">
        {t("title")}
      </h1>
      <p className="mt-2 text-steel">{t("subtitle")}</p>

      <div className="mt-10 space-y-3">
        {((courses ?? []) as Course[]).map((course) => (
          <Link
            key={course.id}
            href={{ pathname: "/admin/course/[id]", params: { id: course.id } }}
            className="flex items-center justify-between gap-4 rounded-xl border border-navy/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md"
          >
            <span>
              <span className="block font-bold text-navy">{course.title}</span>
              <span className="text-xs text-steel">/{course.slug}</span>
            </span>
            <span className="flex gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  course.is_published
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-navy/5 text-steel"
                }`}
              >
                {course.is_published ? t("published") : t("draft")}
              </span>
              {course.beta_open ? (
                <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-ink">
                  {t("betaOpen")}
                </span>
              ) : null}
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-12 rounded-xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-extrabold tracking-wide text-navy">
          {t("newCourse")}
        </h2>
        <form action={createCourse} className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nc-title" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.titlePt")}
              </label>
              <input id="nc-title" name="title" required minLength={2} className={inputCls} />
            </div>
            <div>
              <label htmlFor="nc-title-en" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.titleEn")}
              </label>
              <input id="nc-title-en" name="title_en" className={inputCls} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nc-desc" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.descriptionPt")}
              </label>
              <textarea id="nc-desc" name="description" rows={2} className={inputCls} />
            </div>
            <div>
              <label htmlFor="nc-desc-en" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.descriptionEn")}
              </label>
              <textarea id="nc-desc-en" name="description_en" rows={2} className={inputCls} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input type="checkbox" name="is_published" className="h-4 w-4 accent-navy" />
              {t("fields.published")}
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input type="checkbox" name="beta_open" className="h-4 w-4 accent-navy" />
              {t("fields.betaOpen")}
            </label>
          </div>
          <button type="submit" className={buttonVariants("primary", "md", "justify-self-start")}>
            {t("create")}
          </button>
        </form>
      </section>
    </Container>
  );
}
