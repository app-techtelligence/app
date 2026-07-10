import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getAdminContext } from "@/lib/admin";
import {
  createLesson,
  createModule,
  deleteCourse,
  deleteLesson,
  deleteModule,
  moveLesson,
  moveModule,
  updateCourse,
  updateLesson,
  updateModule,
} from "@/lib/admin-actions";
import type { Course, Lesson, Module } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { VideoUploader } from "@/components/admin/VideoUploader";
import { SaveForm } from "@/components/admin/SaveForm";

type Props = { params: Promise<{ locale: string; id: string }> };

type ModuleWithLessons = Module & { lessons: Lesson[] };

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy focus:border-navy";
const miniBtn =
  "rounded border border-navy/20 px-2 py-1 text-xs font-bold text-navy transition-colors hover:border-navy hover:bg-canvas disabled:opacity-40";
const dangerBtn =
  "rounded border border-red-200 px-2 py-1 text-xs font-bold text-red-700 transition-colors hover:border-red-400 hover:bg-red-50";

export default async function AdminCoursePage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const ctx = await getAdminContext();
  if (!ctx) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const { data: course } = await ctx.supabase
    .from("courses")
    .select(
      "id, slug, title, title_en, description, description_en, is_published, beta_open",
    )
    .eq("id", id)
    .single<Course>();
  if (!course) notFound();

  const { data: modules } = await ctx.supabase
    .from("modules")
    .select(
      "id, course_id, title, title_en, position, lessons(id, module_id, slug, title, title_en, description, description_en, video_key, duration_seconds, position)",
    )
    .eq("course_id", course.id)
    .order("position");

  const uploaderLabels = {
    upload: t("video.upload"),
    replace: t("video.replace"),
    uploading: t("video.uploading"),
    done: t("video.done"),
    error: t("video.error"),
  };

  const saveLabels = { savingLabel: t("saving"), savedLabel: t("saved") };

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <Link href="/admin" className="text-sm font-semibold text-steel hover:text-navy">
        ← {t("back")}
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-wide text-navy">
        {course.title}
      </h1>
      <p className="mt-1 text-xs text-steel">/{course.slug}</p>

      {/* ---------------------------------------------------- course fields */}
      <section className="mt-8 rounded-xl border border-navy/10 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-navy">
          {t("courseSettings")}
        </h2>
        <SaveForm action={updateCourse} {...saveLabels} className="mt-4 grid gap-4">
          <input type="hidden" name="id" value={course.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-title" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.titlePt")}
              </label>
              <input id="c-title" name="title" required defaultValue={course.title} className={inputCls} />
            </div>
            <div>
              <label htmlFor="c-title-en" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.titleEn")}
              </label>
              <input id="c-title-en" name="title_en" defaultValue={course.title_en ?? ""} className={inputCls} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-desc" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.descriptionPt")}
              </label>
              <textarea id="c-desc" name="description" rows={3} defaultValue={course.description ?? ""} className={inputCls} />
            </div>
            <div>
              <label htmlFor="c-desc-en" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.descriptionEn")}
              </label>
              <textarea id="c-desc-en" name="description_en" rows={3} defaultValue={course.description_en ?? ""} className={inputCls} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input type="checkbox" name="is_published" defaultChecked={course.is_published} className="h-4 w-4 accent-navy" />
              {t("fields.published")}
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input type="checkbox" name="beta_open" defaultChecked={course.beta_open} className="h-4 w-4 accent-navy" />
              {t("fields.betaOpen")}
            </label>
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" className={buttonVariants("primary", "md")}>
              {t("save")}
            </button>
          </div>
        </SaveForm>
        <form action={deleteCourse} className="mt-4 border-t border-navy/5 pt-4">
          <input type="hidden" name="id" value={course.id} />
          <button type="submit" className={dangerBtn}>
            {t("deleteCourse")}
          </button>
        </form>
      </section>

      {/* -------------------------------------------------------- modules */}
      <div className="mt-10 space-y-6">
        {((modules ?? []) as ModuleWithLessons[]).map((mod, i, all) => {
          const lessons = [...mod.lessons].sort((a, b) => a.position - b.position);
          return (
            <section key={mod.id} className="rounded-xl border border-navy/10 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-navy/5 px-5 py-4">
                <span className="text-xs font-extrabold tracking-widest text-steel">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="flex-1 truncate font-extrabold tracking-wide text-navy">
                  {mod.title}
                </h2>
                <form action={moveModule}>
                  <input type="hidden" name="id" value={mod.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" disabled={i === 0} className={miniBtn} aria-label={t("moveUp")}>↑</button>
                </form>
                <form action={moveModule}>
                  <input type="hidden" name="id" value={mod.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" disabled={i === all.length - 1} className={miniBtn} aria-label={t("moveDown")}>↓</button>
                </form>
                <form action={deleteModule}>
                  <input type="hidden" name="id" value={mod.id} />
                  <button type="submit" className={dangerBtn}>{t("delete")}</button>
                </form>
              </div>

              <details className="border-b border-navy/5 px-5 py-3">
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-steel hover:text-navy">
                  {t("editSection")}
                </summary>
                <SaveForm action={updateModule} {...saveLabels} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="id" value={mod.id} />
                  <div>
                    <label htmlFor={`m-${mod.id}-t`} className="mb-1 block text-xs font-bold text-navy">
                      {t("fields.titlePt")}
                    </label>
                    <input id={`m-${mod.id}-t`} name="title" required defaultValue={mod.title} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={`m-${mod.id}-te`} className="mb-1 block text-xs font-bold text-navy">
                      {t("fields.titleEn")}
                    </label>
                    <input id={`m-${mod.id}-te`} name="title_en" defaultValue={mod.title_en ?? ""} className={inputCls} />
                  </div>
                  <button type="submit" className={buttonVariants("secondary", "md", "self-end")}>
                    {t("save")}
                  </button>
                </SaveForm>
              </details>

              {/* ------------------------------------------------- lessons */}
              <ol className="divide-y divide-navy/5">
                {lessons.map((lesson, j) => (
                  <li key={lesson.id} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold tracking-widest text-steel">
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 truncate text-sm font-bold text-navy">
                        {lesson.title}
                      </span>
                      {lesson.video_key ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          {t("hasVideo")}
                        </span>
                      ) : (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                          {t("noVideo")}
                        </span>
                      )}
                      <form action={moveLesson}>
                        <input type="hidden" name="id" value={lesson.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button type="submit" disabled={j === 0} className={miniBtn} aria-label={t("moveUp")}>↑</button>
                      </form>
                      <form action={moveLesson}>
                        <input type="hidden" name="id" value={lesson.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button type="submit" disabled={j === lessons.length - 1} className={miniBtn} aria-label={t("moveDown")}>↓</button>
                      </form>
                      <form action={deleteLesson}>
                        <input type="hidden" name="id" value={lesson.id} />
                        <button type="submit" className={dangerBtn}>{t("delete")}</button>
                      </form>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-steel hover:text-navy">
                        {t("editLesson")}
                      </summary>
                      <div className="mt-3 space-y-4">
                        <SaveForm action={updateLesson} {...saveLabels} className="grid gap-3">
                          <input type="hidden" name="id" value={lesson.id} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label htmlFor={`l-${lesson.id}-t`} className="mb-1 block text-xs font-bold text-navy">
                                {t("fields.titlePt")}
                              </label>
                              <input id={`l-${lesson.id}-t`} name="title" required defaultValue={lesson.title} className={inputCls} />
                            </div>
                            <div>
                              <label htmlFor={`l-${lesson.id}-te`} className="mb-1 block text-xs font-bold text-navy">
                                {t("fields.titleEn")}
                              </label>
                              <input id={`l-${lesson.id}-te`} name="title_en" defaultValue={lesson.title_en ?? ""} className={inputCls} />
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label htmlFor={`l-${lesson.id}-d`} className="mb-1 block text-xs font-bold text-navy">
                                {t("fields.descriptionPt")}
                              </label>
                              <textarea id={`l-${lesson.id}-d`} name="description" rows={2} defaultValue={lesson.description ?? ""} className={inputCls} />
                            </div>
                            <div>
                              <label htmlFor={`l-${lesson.id}-de`} className="mb-1 block text-xs font-bold text-navy">
                                {t("fields.descriptionEn")}
                              </label>
                              <textarea id={`l-${lesson.id}-de`} name="description_en" rows={2} defaultValue={lesson.description_en ?? ""} className={inputCls} />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-end gap-5">
                            <div>
                              <label htmlFor={`l-${lesson.id}-dur`} className="mb-1 block text-xs font-bold text-navy">
                                {t("fields.durationSeconds")}
                              </label>
                              <input id={`l-${lesson.id}-dur`} name="duration_seconds" type="number" min={0} defaultValue={lesson.duration_seconds ?? ""} className={`${inputCls} w-32`} />
                            </div>
                            <button type="submit" className={buttonVariants("secondary", "md")}>
                              {t("save")}
                            </button>
                          </div>
                        </SaveForm>
                        <div className="flex items-center gap-3 border-t border-navy/5 pt-3">
                          <VideoUploader
                            lessonId={lesson.id}
                            hasVideo={Boolean(lesson.video_key)}
                            labels={uploaderLabels}
                          />
                          {lesson.video_key ? (
                            <span className="truncate text-xs text-steel">{lesson.video_key}</span>
                          ) : null}
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>

              <details className="px-5 py-4">
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-accent-ink hover:text-navy">
                  + {t("newLesson")}
                </summary>
                <SaveForm action={createLesson} {...saveLabels} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="module_id" value={mod.id} />
                  <div>
                    <label htmlFor={`nl-${mod.id}-t`} className="mb-1 block text-xs font-bold text-navy">
                      {t("fields.titlePt")}
                    </label>
                    <input id={`nl-${mod.id}-t`} name="title" required className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={`nl-${mod.id}-te`} className="mb-1 block text-xs font-bold text-navy">
                      {t("fields.titleEn")}
                    </label>
                    <input id={`nl-${mod.id}-te`} name="title_en" className={inputCls} />
                  </div>
                  <button type="submit" className={buttonVariants("primary", "md", "self-end")}>
                    {t("create")}
                  </button>
                </SaveForm>
              </details>
            </section>
          );
        })}
      </div>

      {/* ------------------------------------------------------ new module */}
      <section className="mt-8 rounded-xl border border-dashed border-navy/20 bg-white/60 p-6">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-navy">
          + {t("newSection")}
        </h2>
        <SaveForm action={createModule} {...saveLabels} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="course_id" value={course.id} />
          <div>
            <label htmlFor="nm-t" className="mb-1 block text-xs font-bold text-navy">
              {t("fields.titlePt")}
            </label>
            <input id="nm-t" name="title" required className={inputCls} />
          </div>
          <div>
            <label htmlFor="nm-te" className="mb-1 block text-xs font-bold text-navy">
              {t("fields.titleEn")}
            </label>
            <input id="nm-te" name="title_en" className={inputCls} />
          </div>
          <button type="submit" className={buttonVariants("primary", "md", "self-end")}>
            {t("create")}
          </button>
        </SaveForm>
      </section>
    </Container>
  );
}
