import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { localized } from "@/lib/content";
import type { Course, Lesson, Module } from "@/lib/types";
import { Container } from "@/components/ui/Container";

type Props = {
  params: Promise<{ locale: string; slug: string; lessonSlug: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { locale, slug, lessonSlug } = await params;
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
      "id, lessons(id, slug, title, title_en, description, description_en, video_key)",
    )
    .eq("course_id", course.id);

  const lesson = ((modules ?? []) as Array<Module & { lessons: Lesson[] }>)
    .flatMap((m) => m.lessons)
    .find((l) => l.slug === lessonSlug);
  if (!lesson) notFound();

  // Access check — the media route enforces this again (defense in depth).
  // Admins can preview any lesson without enrolling.
  const [{ data: enrollment }, { data: profile }] = await Promise.all([
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
  ]);

  if (!enrollment && profile?.role !== "admin") {
    redirect({
      href: { pathname: "/course/[slug]", params: { slug: course.slug } },
      locale,
    });
    return null;
  }

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

      <div className="mt-8 overflow-hidden rounded-xl border border-navy/10 bg-navy-deep shadow-sm">
        {lesson.video_key ? (
          <video
            controls
            preload="metadata"
            controlsList="nodownload"
            className="aspect-video w-full"
            src={`/api/media/${lesson.id}`}
          />
        ) : (
          <p className="p-10 text-center text-white/70">{t("noVideo")}</p>
        )}
      </div>

      {lesson.description ? (
        <p className="mt-6 leading-relaxed text-steel">
          {localized(locale, lesson.description, lesson.description_en)}
        </p>
      ) : null}
    </Container>
  );
}
