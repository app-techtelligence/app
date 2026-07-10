"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getAdminContext } from "@/lib/admin";
import { slugify } from "@/lib/slugify";

/**
 * Blog admin mutations (same conventions as admin-actions.ts): every action
 * re-checks the admin role, RLS enforces it again, and plain <form action>
 * usage means failed validation simply leaves the data unchanged.
 */

function refresh() {
  revalidatePath("/", "layout");
}

const title = z.string().trim().min(2).max(200);

// Textareas always post a value; empty string is a valid draft state.
const longText = z
  .string()
  .max(100_000)
  .optional()
  .transform((v) => (v ?? "").trim());

// Comma-separated input → up to 10 trimmed tags (PT and EN fields alike).
const tagList = z
  .string()
  .max(500)
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 10),
  );

export async function createPost(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const parsed = z
    .object({ title, title_en: title })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  // Timestamp suffix keeps slugs unique without a retry loop; the editor
  // shows the final slug right after creation. The `post-` fallback covers
  // titles with no ASCII alphanumerics, which slugify to "".
  const suffix = Date.now().toString(36).slice(-4);
  const slug = slugify(parsed.data.title) || `post-${suffix}`;
  const slugEn = slugify(parsed.data.title_en) || `post-en-${suffix}`;

  const { data: existing } = await ctx.supabase
    .from("posts")
    .select("id")
    .or(`slug.eq.${slug},slug_en.eq.${slugEn}`)
    .limit(1)
    .maybeSingle();

  const { data: created, error } = await ctx.supabase
    .from("posts")
    .insert({
      title: parsed.data.title,
      title_en: parsed.data.title_en,
      slug: existing ? `${slug}-${suffix}` : slug,
      slug_en: existing ? `${slugEn}-${suffix}` : slugEn,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !created) return;

  refresh();
  redirect({
    href: { pathname: "/admin/blog/[id]", params: { id: created.id } },
    locale: await getLocale(),
  });
}

const postSchema = z.object({
  title,
  title_en: title,
  excerpt: longText,
  excerpt_en: longText,
  body_md: longText,
  body_md_en: longText,
  tags: tagList,
  tags_en: tagList,
  // Unchecked checkboxes are absent from FormData entirely.
  is_published: z.coerce.boolean().default(false),
});

export async function updatePost(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!id.success || !parsed.success) return;

  const { data: current } = await ctx.supabase
    .from("posts")
    .select("published_at")
    .eq("id", id.data)
    .maybeSingle<{ published_at: string | null }>();
  if (!current) return;

  // Publishing requires complete content in BOTH languages (site-wide rule).
  const complete =
    parsed.data.excerpt.length > 0 &&
    parsed.data.excerpt_en.length > 0 &&
    parsed.data.body_md.length > 0 &&
    parsed.data.body_md_en.length > 0;
  const isPublished = parsed.data.is_published && complete;

  const { error } = await ctx.supabase
    .from("posts")
    .update({
      ...parsed.data,
      is_published: isPublished,
      // First publish stamps the date; it survives later unpublish/republish.
      published_at:
        current.published_at ?? (isPublished ? new Date().toISOString() : null),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id.data);
  if (error) return;
  refresh();
}

export async function deletePost(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const { data: post } = await ctx.supabase
    .from("posts")
    .select("cover_key")
    .eq("id", id.data)
    .maybeSingle<{ cover_key: string | null }>();

  // .select() proves rows were actually deleted — a silent 0-row delete
  // (e.g. RLS filtering) must not trigger the irreversible R2 cleanup.
  const { data: deleted, error } = await ctx.supabase
    .from("posts")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error || !deleted?.length) return;

  if (post?.cover_key) {
    try {
      await getCloudflareContext().env.MEDIA.delete(post.cover_key);
    } catch (cleanupError) {
      console.error("R2 cleanup failed for key:", post.cover_key, cleanupError);
    }
  }
  refresh();
  redirect({ href: "/admin/blog", locale: await getLocale() });
}

export async function removePostCover(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const { data: post } = await ctx.supabase
    .from("posts")
    .select("cover_key")
    .eq("id", id.data)
    .maybeSingle<{ cover_key: string | null }>();
  if (!post?.cover_key) return;

  const { error } = await ctx.supabase
    .from("posts")
    .update({ cover_key: null })
    .eq("id", id.data);
  if (error) return;

  try {
    await getCloudflareContext().env.MEDIA.delete(post.cover_key);
  } catch (cleanupError) {
    console.error("R2 cleanup failed for key:", post.cover_key, cleanupError);
  }
  refresh();
}
