import { revalidatePath } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Enrollment } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const [{ data: courses }, { data: enrollments }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, slug, title, description, is_published, beta_open")
      .order("created_at"),
    supabase
      .from("enrollments")
      .select("user_id, course_id, status")
      .eq("status", "active"),
  ]);

  const enrolledIds = new Set(
    ((enrollments ?? []) as Enrollment[]).map((e) => e.course_id),
  );

  async function enroll(formData: FormData) {
    "use server";
    const courseId = String(formData.get("courseId") ?? "");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !courseId) return;
    // RLS only allows self-enrollment into published beta_open courses.
    await supabase
      .from("enrollments")
      .insert({ user_id: user.id, course_id: courseId });
    revalidatePath("/", "layout");
  }

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="text-3xl font-extrabold tracking-wide text-navy">
        {t("title")}
      </h1>
      <p className="mt-2 text-steel">{t("subtitle")}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {((courses ?? []) as Course[]).map((course) => {
          const enrolled = enrolledIds.has(course.id);
          return (
            <div
              key={course.id}
              className="flex flex-col rounded-xl border border-navy/10 bg-white p-7 shadow-sm"
            >
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-ink">
                {enrolled ? t("enrolledTag") : t("betaTag")}
              </span>
              <h2 className="mt-2 text-xl font-extrabold tracking-wide text-navy">
                {course.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-steel">
                {course.description}
              </p>
              {enrolled ? (
                <Link
                  href={{ pathname: "/course/[slug]", params: { slug: course.slug } }}
                  className={buttonVariants("primary", "md", "mt-6")}
                >
                  {t("continue")}
                </Link>
              ) : course.beta_open ? (
                <form action={enroll} className="mt-6">
                  <input type="hidden" name="courseId" value={course.id} />
                  <button
                    type="submit"
                    className={buttonVariants("secondary", "md", "w-full")}
                  >
                    {t("enroll")}
                  </button>
                </form>
              ) : (
                <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-steel">
                  {t("closed")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {(courses ?? []).length === 0 ? (
        <p className="mt-10 rounded-xl border border-navy/10 bg-white p-8 text-center text-steel">
          {t("empty")}
        </p>
      ) : null}
    </Container>
  );
}
