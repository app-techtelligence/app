import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { localized } from "@/lib/content";
import type { Course, Lesson, Module } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import {
  CourseOutline,
  type OutlineSection,
} from "@/components/course/CourseOutline";

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

  const [{ data: modules }, { data: enrollment }, { data: profile }, { data: progressRows }] =
    await Promise.all([
      supabase
        .from("modules")
        .select(
          "id, course_id, title, title_en, position, lessons(id, module_id, slug, title, title_en, description, description_en, video_key, duration_seconds, position)",
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
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single<{ role: string }>(),
      supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id),
    ]);

  const enrolled = Boolean(enrollment);
  // Mirrors the lesson page / media route check: admins can preview
  // any lesson without enrolling.
  const accessible = enrolled || profile?.role === "admin";
  const doneIds = new Set(
    ((progressRows ?? []) as Array<{ lesson_id: string }>).map((r) => r.lesson_id),
  );

  const sortedModules = ((modules ?? []) as ModuleWithLessons[]).map((mod) => ({
    ...mod,
    lessons: [...mod.lessons].sort((a, b) => a.position - b.position),
  }));
  // Continuous lesson numbering across modules (01, 02, …).
  const offsets = sortedModules.map((_, i) =>
    sortedModules.slice(0, i).reduce((sum, m) => sum + m.lessons.length, 0),
  );

  const sections: OutlineSection[] = sortedModules.map((mod, modIndex) => {
    const doneCount = mod.lessons.filter((l) => doneIds.has(l.id)).length;
    return {
      id: mod.id,
      title: localized(locale, mod.title, mod.title_en) ?? mod.title,
      chip: accessible
        ? t("sectionProgress", { done: doneCount, total: mod.lessons.length })
        : t("lessonCount", { count: mod.lessons.length }),
      lessons: mod.lessons.map((lesson, lessonIndex) => ({
        id: lesson.id,
        slug: lesson.slug,
        number: String(offsets[modIndex] + lessonIndex + 1).padStart(2, "0"),
        title: localized(locale, lesson.title, lesson.title_en) ?? lesson.title,
        description: localized(locale, lesson.description, lesson.description_en),
        durationLabel: lesson.duration_seconds
          ? formatDuration(lesson.duration_seconds)
          : null,
        done: doneIds.has(lesson.id),
      })),
    };
  });

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const totalDone = sections.reduce(
    (sum, s) => sum + s.lessons.filter((l) => l.done).length,
    0,
  );
  const percent = totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0;

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

      {accessible && totalLessons > 0 ? (
        <div className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-extrabold uppercase tracking-[0.2em] text-navy">
              {t("progressTitle")}
            </span>
            <span className="text-sm font-semibold text-steel">
              {t("progressCount", { done: totalDone, total: totalLessons })}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={t("progressTitle")}
            aria-valuemin={0}
            aria-valuemax={totalLessons}
            aria-valuenow={totalDone}
            aria-valuetext={t("progressCount", { done: totalDone, total: totalLessons })}
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-navy/10"
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      ) : null}

      <CourseOutline
        courseSlug={course.slug}
        sections={sections}
        accessible={accessible}
        labels={{
          searchLabel: t("searchLabel"),
          searchPlaceholder: t("searchPlaceholder"),
          clearSearch: t("clearSearch"),
          noResults: t("noResults"),
          locked: t("locked"),
          doneBadge: t("doneBadge"),
        }}
      />
    </Container>
  );
}
