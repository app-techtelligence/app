import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Read-only access to published blog posts. Uses the public anon key with no
 * session — RLS only exposes rows with is_published = true. Every helper
 * degrades to "no posts" if the environment or the table is missing, so the
 * blog pages never hard-fail.
 */

export type BlogPost = {
  id: string;
  slug: string;
  slug_en: string;
  title: string;
  title_en: string;
  excerpt: string;
  excerpt_en: string;
  body_md: string;
  body_md_en: string;
  cover_key: string | null;
  tags: string[];
  tags_en: string[];
  published_at: string | null;
  updated_at: string | null;
};

// select("*") instead of an explicit column list: content migrations run by
// hand in the SQL editor and code deploys aren't atomic — an unknown column
// in an explicit list would turn the whole blog empty until they align.
const POST_COLUMNS = "*";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function listPublishedPosts(): Promise<BlogPost[]> {
  const supabase = client();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    return (data ?? []) as BlogPost[];
  } catch {
    return [];
  }
}

// React cache(): generateMetadata and the page body share one query.
export const getPublishedPost = cache(
  async (locale: string, slug: string): Promise<BlogPost | null> => {
    const supabase = client();
    if (!supabase) return null;
    try {
      const { data } = await supabase
        .from("posts")
        .select(POST_COLUMNS)
        .eq(locale === "en" ? "slug_en" : "slug", slug)
        .eq("is_published", true)
        .maybeSingle<BlogPost>();
      return data ?? null;
    } catch {
      return null;
    }
  },
);

/** Locale-appropriate slug for links (PT slug at root, EN slug under /en). */
export function postSlug(post: BlogPost, locale: string): string {
  return locale === "en" ? post.slug_en : post.slug;
}

export function localizedField(
  locale: string,
  pt: string,
  en: string,
): string {
  return locale === "en" && en ? en : pt;
}

/** Locale-appropriate tags; falls back to PT when EN tags are missing
 *  (nullish guard covers rows read before migration 0006 ran). */
export function localizedTags(locale: string, post: BlogPost): string[] {
  const en = post.tags_en ?? [];
  return locale === "en" && en.length > 0 ? en : post.tags;
}

/** ~200 words per minute, minimum 1. */
export function readingTimeMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function coverUrl(post: BlogPost): string | null {
  return post.cover_key ? `/api/blog-media/${post.cover_key}` : null;
}
