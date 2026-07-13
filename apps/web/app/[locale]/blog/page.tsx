import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";
import { listPublishedPosts } from "@/lib/blog";
import { Container } from "@/components/ui/Container";
import { TriangleDivider } from "@/components/ui/TriangleDivider";
import { PostCard } from "@/components/blog/PostCard";

// Posts come from the database at request time — a new post is a new page
// with no redeploy.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "blog", "/blog");
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const posts = await listPublishedPosts();

  return (
    <>
      <section className="bg-gradient-to-b from-navy to-navy-deep py-16 text-center sm:py-20">
        <Container className="flex flex-col items-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-steel-light">
            {t("kicker")}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-wide text-white sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            {t("subtitle")}
          </p>
        </Container>
      </section>

      <section className="bg-canvas py-16 sm:py-20">
        <Container>
          {posts.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <TriangleDivider tone="steel" />
              <p className="mt-4 max-w-md text-steel">{t("empty")}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  locale={locale}
                  readMoreLabel={t("readMore")}
                />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
