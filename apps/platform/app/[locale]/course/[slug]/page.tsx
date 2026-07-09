import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { localized } from "@/lib/content";
import type { Course, Lesson, Module } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { ClockIcon, LockIcon, PlayIcon, TriangleBullet } from "@/components/ui/icons";

type Props = { params: Promise<{ locale: string; slug: string }> };

type ModuleWithLessons = Module & { lessons: Lesson[] };

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export default async function CoursePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("course");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, slug, title, title_en, description, description_en, is_published, beta_open",
    )
    .eq("slug", slug)
    .single<Course>();
  if (!course) notFound();

  const [{ data: modules }, { data: enrollment }] = await Promise.all([
    supabase
      .from("modules")
      .select(
        "id, course_id, title, title_en, position, lessons(id, module_id, slug, title, title_en, description, description_en, video_key, duration_seconds, position, is_free_preview)",
      )
      .eq("course_id", course.id)
      .order("position"),
    supabase
      .from("enrollments")
      .select("status")
      .eq("course_id", course.id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const enrolled = Boolean(enrollment);
  const sortedModules = ((modules ?? []) as ModuleWithLessons[]).map((mod) => ({
    ...mod,
    lessons: [...mod.lessons].sort((a, b) => a.position - b.position),
  }));
  // Continuous lesson numbering across modules (01, 02, …).
  const offsets = sortedModules.map((_, i) =>
    sortedModules.slice(0, i).reduce((sum, m) => sum + m.lessons.length, 0),
  );

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <Link href="/dashboard" className="text-sm font-semibold text-steel hover:text-navy">
        ← {t("back")}
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-wide text-navy">
        {localized(locale, course.title, course.title_en)}
      </h1>
      <p className="mt-3 text-steel">
        {localized(locale, course.description, course.description_en)}
      </p>

      {!enrolled ? (
        <p className="mt-6 rounded-md bg-accent/10 px-4 py-3 text-sm font-medium text-accent-ink">
          {t("notEnrolled")}
        </p>
      ) : null}

      <div className="mt-10 space-y-10">
        {sortedModules.map((mod, modIndex) => {
          const lessons = mod.lessons;
          return (
            <section key={mod.id}>
              <div className="flex items-center gap-3">
                <TriangleBullet className="h-3 w-3 text-accent" />
                <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-navy">
                  {localized(locale, mod.title, mod.title_en)}
                </h2>
                <span className="ml-auto rounded-full bg-navy/5 px-3 py-1 text-xs font-bold text-steel">
                  {t("lessonCount", { count: lessons.length })}
                </span>
              </div>

              <ol className="mt-4 space-y-3">
                {lessons.map((lesson, lessonIndex) => {
                  const accessible = enrolled || lesson.is_free_preview;
                  const number = String(offsets[modIndex] + lessonIndex + 1).padStart(2, "0");
                  const title = localized(locale, lesson.title, lesson.title_en);
                  const description = localized(
                    locale,
                    lesson.description,
                    lesson.description_en,
                  );

                  const inner = (
                    <>
                      <span
                        aria-hidden="true"
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                          accessible
                            ? "bg-navy text-white group-hover:bg-accent group-hover:text-navy"
                            : "bg-navy/5 text-steel"
                        }`}
                      >
                        {accessible ? (
                          <PlayIcon className="h-4 w-4 translate-x-px" />
                        ) : (
                          <LockIcon className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span
                            aria-hidden="true"
                            className="text-xs font-extrabold tracking-widest text-steel"
                          >
                            {number}
                          </span>
                          <span className="truncate font-bold text-navy">
                            {title}
                          </span>
                          {lesson.is_free_preview && !enrolled ? (
                            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-ink">
                              {t("freePreview")}
                            </span>
                          ) : null}
                        </span>
                        {description ? (
                          <span className="mt-0.5 line-clamp-1 block text-sm text-steel">
                            {description}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-4">
                        {lesson.duration_seconds ? (
                          <span className="hidden items-center gap-1.5 text-xs font-semibold text-steel sm:flex">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {formatDuration(lesson.duration_seconds)}
                          </span>
                        ) : null}
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            accessible
                              ? "text-accent-ink group-hover:text-navy"
                              : "text-steel"
                          }`}
                        >
                          {accessible ? t("watch") : t("locked")}
                        </span>
                      </span>
                    </>
                  );

                  return (
                    <li key={lesson.id}>
                      {accessible ? (
                        <Link
                          href={{
                            pathname: "/course/[slug]/lesson/[lessonSlug]",
                            params: { slug: course.slug, lessonSlug: lesson.slug },
                          }}
                          className="group flex items-center gap-4 rounded-xl border border-navy/10 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md sm:p-5"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-4 rounded-xl border border-dashed border-navy/15 bg-white/60 p-4 sm:p-5">
                          {inner}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
              {modIndex < (modules ?? []).length - 1 ? (
                <div aria-hidden="true" className="mt-8 border-b border-navy/5" />
              ) : null}
            </section>
          );
        })}
      </div>
    </Container>
  );
}
