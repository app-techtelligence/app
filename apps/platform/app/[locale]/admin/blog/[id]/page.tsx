import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getAdminContext } from "@/lib/admin";
import { updatePost, deletePost, removePostCover } from "@/lib/blog-actions";
import type { Post } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { CoverUploader } from "@/components/admin/CoverUploader";
import { SaveForm } from "@/components/admin/SaveForm";

type Props = { params: Promise<{ locale: string; id: string }> };

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy focus:border-navy";

const dangerBtn =
  "rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100";

export default async function AdminPostPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.blog");
  const tAdmin = await getTranslations("admin");

  const ctx = await getAdminContext();
  if (!ctx) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const { data: post } = await ctx.supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle<Post>();
  if (!post) notFound();

  const coverLabels = {
    upload: t("cover.upload"),
    replace: t("cover.replace"),
    uploading: t("cover.uploading"),
    done: t("cover.done"),
    error: t("cover.error"),
  };

  const saveLabels = { savingLabel: tAdmin("saving"), savedLabel: tAdmin("saved") };

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <Link href="/admin/blog" className="text-sm font-semibold text-steel hover:text-navy">
        ← {t("back")}
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-wide text-navy">
        {post.title}
      </h1>
      <p className="mt-1 text-xs text-steel">
        /blog/{post.slug} · /en/blog/{post.slug_en}
      </p>

      {/* ------------------------------------------------------------ cover */}
      <section className="mt-8 rounded-xl border border-navy/10 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-navy">
          {t("cover.title")}
        </h2>
        {post.cover_key ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2-served preview, unoptimized images config
          <img
            // cover_key changes on every upload — cache-busts the preview
            // after a replace (same src would never be re-requested).
            src={`/api/admin/blog-cover?postId=${post.id}&v=${encodeURIComponent(post.cover_key)}`}
            alt=""
            className="mt-4 max-h-56 rounded-lg border border-navy/10 object-cover"
          />
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CoverUploader postId={post.id} hasCover={Boolean(post.cover_key)} labels={coverLabels} />
          {post.cover_key ? (
            <SaveForm action={removePostCover} {...saveLabels}>
              <input type="hidden" name="id" value={post.id} />
              <button type="submit" className={dangerBtn}>
                {t("cover.remove")}
              </button>
            </SaveForm>
          ) : null}
        </div>
      </section>

      {/* ----------------------------------------------------------- fields */}
      <section className="mt-8 rounded-xl border border-navy/10 bg-white p-6 shadow-sm">
        <SaveForm action={updatePost} {...saveLabels} className="grid gap-5">
          <input type="hidden" name="id" value={post.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-title" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.titlePt")}
              </label>
              <input id="p-title" name="title" required maxLength={200} defaultValue={post.title} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-title-en" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.titleEn")}
              </label>
              <input id="p-title-en" name="title_en" required maxLength={200} defaultValue={post.title_en} className={inputCls} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-excerpt" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.excerptPt")}
              </label>
              <textarea id="p-excerpt" name="excerpt" rows={3} defaultValue={post.excerpt} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-excerpt-en" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.excerptEn")}
              </label>
              <textarea id="p-excerpt-en" name="excerpt_en" rows={3} defaultValue={post.excerpt_en} className={inputCls} />
            </div>
          </div>

          <MarkdownField
            name="body_md"
            label={t("fields.bodyPt")}
            defaultValue={post.body_md}
            writeLabel={t("write")}
            previewLabel={t("preview")}
          />
          <MarkdownField
            name="body_md_en"
            label={t("fields.bodyEn")}
            defaultValue={post.body_md_en}
            writeLabel={t("write")}
            previewLabel={t("preview")}
          />

          <div>
            <label htmlFor="p-tags" className="mb-1 block text-xs font-bold text-navy">
              {t("fields.tags")}
            </label>
            <input
              id="p-tags"
              name="tags"
              maxLength={500}
              defaultValue={post.tags.join(", ")}
              placeholder={t("fields.tagsHint")}
              className={inputCls}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input
                type="checkbox"
                name="is_published"
                defaultChecked={post.is_published}
                className="h-4 w-4 accent-navy"
              />
              {t("fields.published")}
            </label>
            <span className="text-xs text-steel">{t("publishHint")}</span>
          </div>

          <button type="submit" className={buttonVariants("primary", "md", "justify-self-start")}>
            {t("save")}
          </button>
        </SaveForm>

        <form action={deletePost} className="mt-6 border-t border-navy/5 pt-4">
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className={dangerBtn}>
            {t("deletePost")}
          </button>
        </form>
      </section>
    </Container>
  );
}
