import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";
import {
  coverUrl,
  getPublishedPost,
  localizedField,
  localizedTags,
  readingTimeMinutes,
  type BlogPost,
} from "@/lib/blog";
import { Container } from "@/components/ui/Container";
import { ClockIcon } from "@/components/ui/icons";
import { PostBody } from "@/components/blog/PostBody";
import { ShareRow } from "@/components/blog/ShareRow";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

/** Absolute per-locale URL; the two locales use different slugs. */
function postUrl(post: BlogPost, locale: string): string {
  return locale === "en"
    ? `${siteConfig.url}/en/blog/${post.slug_en}`
    : `${siteConfig.url}/blog/${post.slug}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublishedPost(locale, slug);
  if (!post) return {};

  const title = localizedField(locale, post.title, post.title_en);
  const description = localizedField(locale, post.excerpt, post.excerpt_en);
  const canonical = postUrl(post, locale);
  const cover = coverUrl(post);

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${title} — ${siteConfig.name}`,
    description,
    alternates: {
      canonical,
      languages: {
        "pt-BR": postUrl(post, "pt-BR"),
        en: postUrl(post, "en"),
        "x-default": postUrl(post, "pt-BR"),
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: locale === "en" ? "en_US" : "pt_BR",
      type: "article",
      publishedTime: post.published_at ?? undefined,
      tags: localizedTags(locale, post),
      images: [{ url: cover ?? "/og/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  const post = await getPublishedPost(locale, slug);
  if (!post) notFound();

  const title = localizedField(locale, post.title, post.title_en);
  const body = localizedField(locale, post.body_md, post.body_md_en);
  const excerpt = localizedField(locale, post.excerpt, post.excerpt_en);
  const tags = localizedTags(locale, post);
  const cover = coverUrl(post);
  const minutes = readingTimeMinutes(body);
  // Fixed timezone: Workers run in UTC, which would shift evening publishes
  // to the next day for Brazilian readers.
  const date = post.published_at
    ? new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
        dateStyle: "long",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(post.published_at))
    : null;

  const shareLabels = {
    share: t("share.label"),
    linkedin: t("share.linkedin"),
    x: t("share.x"),
    copy: t("share.copy"),
    copied: t("share.copied"),
  };

  return (
    <article className="bg-white py-12 sm:py-16">
      <Container className="max-w-3xl">
        <Link
          href="/blog"
          className="text-sm font-semibold text-steel transition-colors hover:text-navy"
        >
          ← {t("backToBlog")}
        </Link>

        <header className="mt-6">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold text-steel"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-wide text-navy sm:text-4xl">
            {title}
          </h1>

          {excerpt ? (
            <p className="mt-4 text-lg leading-relaxed text-steel">{excerpt}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-steel">
            {date ? <time dateTime={post.published_at ?? undefined}>{date}</time> : null}
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              {t("readingTime", { minutes })}
            </span>
          </div>
        </header>

        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2-served, images unoptimized in this app
          <img
            src={cover}
            alt=""
            className="mt-8 aspect-[16/9] w-full rounded-xl object-cover"
          />
        ) : null}

        <div className="mt-10">
          <PostBody markdown={body} />
        </div>

        <footer className="mt-12 border-t border-navy/10 pt-8">
          <ShareRow url={postUrl(post, locale)} title={title} labels={shareLabels} />
        </footer>
      </Container>
    </article>
  );
}
