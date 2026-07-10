import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/brand/LogoMark";
import { ArrowRightIcon } from "@/components/ui/icons";
import {
  coverUrl,
  localizedField,
  postSlug,
  type BlogPost,
} from "@/lib/blog";

type Props = {
  post: BlogPost;
  locale: string;
  readMoreLabel: string;
};

export function PostCard({ post, locale, readMoreLabel }: Props) {
  const cover = coverUrl(post);
  const title = localizedField(locale, post.title, post.title_en);
  const excerpt = localizedField(locale, post.excerpt, post.excerpt_en);

  return (
    <Link
      href={{ pathname: "/blog/[slug]", params: { slug: postSlug(post, locale) } }}
      className="group flex flex-col overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2-served, images are unoptimized in this app
        <img
          src={cover}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
      ) : (
        <span className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-b from-navy to-navy-deep">
          <LogoMark className="h-16 w-auto text-white/20" />
        </span>
      )}

      <span className="flex flex-1 flex-col p-6">
        {post.tags.length > 0 ? (
          <span className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-navy/15 px-2.5 py-0.5 text-[11px] font-semibold text-steel"
              >
                {tag}
              </span>
            ))}
          </span>
        ) : null}
        <span className="mt-3 text-lg font-extrabold leading-snug tracking-wide text-navy">
          {title}
        </span>
        {excerpt ? (
          <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-steel">
            {excerpt}
          </span>
        ) : null}
        <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-bold text-navy transition-colors group-hover:text-accent-strong">
          {readMoreLabel}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}
