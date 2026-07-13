import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { localized } from "@/lib/content";
import type { Course, Lesson, Module } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import {
  LessonPlayer,
  type AdjacentLesson,
} from "@/components/course/LessonPlayer";

type Props = {
  params: Promise<{ locale: string; slug: string; lessonSlug: string }>;
  searchParams: Promise<{ autoplay?: string }>;
};

export default async function LessonPage({ params, searchParams }: Props) {
  const { locale, slug, lessonSlug } = await params;
  const { autoplay } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("lesson");

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
    .select("id, slug, title, title_en")
    .eq("slug", slug)
    .single<Pick<Course, "id" | "slug" | "title" | "title_en">>();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select(
      "id, position, lessons(id, slug, title, title_en, description, description_en, video_key, position)",
    )
    .eq("course_id", course.id);

  // Course order (modules then lessons by position) drives prev/next.
  const orderedLessons = ((modules ?? []) as Array<Module & { lessons: Lesson[] }>)
    .sort((a, b) => a.position - b.position)
    .flatMap((m) => [...m.lessons].sort((a, b) => a.position - b.position));

  const index = orderedLessons.findIndex((l) => l.slug === lessonSlug);
  const lesson = index === -1 ? undefined : orderedLessons[index];
  if (!lesson) notFound();

  // Access check — the media route enforces this again (defense in depth).
  // Admins can preview any lesson without enrolling.
  const [{ data: enrollment }, { data: profile }, { data: progress }] =
    await Promise.all([
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
        .eq("user_id", user.id)
        .eq("lesson_id", lesson.id)
        .maybeSingle(),
    ]);

  if (!enrollment && profile?.role !== "admin") {
    redirect({
      href: { pathname: "/course/[slug]", params: { slug: course.slug } },
      locale,
    });
    return null;
  }

  const adjacent = (l: Lesson | null): AdjacentLesson | null =>
    l ? { slug: l.slug, title: localized(locale, l.title, l.title_en) ?? l.title } : null;
  const prevLesson = adjacent(index > 0 ? orderedLessons[index - 1] : null);
  const nextLesson = adjacent(
    index < orderedLessons.length - 1 ? orderedLessons[index + 1] : null,
  );

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <Link
        href={{ pathname: "/course/[slug]", params: { slug: course.slug } }}
        className="text-sm font-semibold text-steel hover:text-navy"
      >
        ← {localized(locale, course.title, course.title_en)}
      </Link>

      <h1 className="mt-4 text-2xl font-extrabold tracking-wide text-navy sm:text-3xl">
        {localized(locale, lesson.title, lesson.title_en)}
      </h1>

      <LessonPlayer
        lessonId={lesson.id}
        courseSlug={course.slug}
        videoSrc={lesson.video_key ? `/api/media/${lesson.id}` : null}
        autoPlay={autoplay === "1"}
        initialDone={Boolean(progress)}
        prev={prevLesson}
        next={nextLesson}
        labels={{
          noVideo: t("noVideo"),
          markDone: t("markDone"),
          unmarkDone: t("unmarkDone"),
          done: t("done"),
          previous: t("previous"),
          next: t("next"),
          advancing: t("advancing"),
        }}
      />

      {lesson.description ? (
        <p className="mt-6 leading-relaxed text-steel">
          {localized(locale, lesson.description, lesson.description_en)}
        </p>
      ) : null}
    </Container>
  );
}
