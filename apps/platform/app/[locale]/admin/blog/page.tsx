import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { getAdminContext } from "@/lib/admin";
import { createPost } from "@/lib/blog-actions";
import type { Post } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";

type Props = { params: Promise<{ locale: string }> };

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy focus:border-navy";

export default async function AdminBlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.blog");

  const ctx = await getAdminContext();
  if (!ctx) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const { data: posts } = await ctx.supabase
    .from("posts")
    .select("id, slug, slug_en, title, title_en, is_published, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <Container className="max-w-4xl py-12 sm:py-16">
      <Link href="/admin" className="text-sm font-semibold text-steel hover:text-navy">
        ← {t("backToAdmin")}
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-wide text-navy">
        {t("title")}
      </h1>
      <p className="mt-2 text-steel">{t("subtitle")}</p>

      <section className="mt-10 rounded-xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-extrabold tracking-wide text-navy">
          {t("newPost")}
        </h2>
        <form action={createPost} className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="np-title" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.titlePt")}
              </label>
              <input id="np-title" name="title" required minLength={2} className={inputCls} />
            </div>
            <div>
              <label htmlFor="np-title-en" className="mb-1 block text-xs font-bold text-navy">
                {t("fields.titleEn")}
              </label>
              <input id="np-title-en" name="title_en" required minLength={2} className={inputCls} />
            </div>
          </div>
          <button type="submit" className={buttonVariants("primary", "md", "justify-self-start")}>
            {t("create")}
          </button>
        </form>
      </section>

      <div className="mt-10 space-y-3">
        {((posts ?? []) as Post[]).map((post) => (
          <Link
            key={post.id}
            href={{ pathname: "/admin/blog/[id]", params: { id: post.id } }}
            className="flex items-center justify-between gap-4 rounded-xl border border-navy/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md"
          >
            <span>
              <span className="block font-bold text-navy">{post.title}</span>
              <span className="text-xs text-steel">/blog/{post.slug}</span>
            </span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                post.is_published
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-navy/5 text-steel"
              }`}
            >
              {post.is_published ? t("published") : t("draft")}
            </span>
          </Link>
        ))}
        {(posts ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed border-navy/15 p-6 text-sm text-steel">
            {t("empty")}
          </p>
        ) : null}
      </div>
    </Container>
  );
}
