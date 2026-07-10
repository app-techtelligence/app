"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getAdminContext } from "@/lib/admin";

/**
 * Admin mutations. Every action re-checks the admin role server-side;
 * RLS policies enforce it again at the database (defense in depth).
 * Actions are used as plain <form action>, so they return void; failed
 * validation or RLS rejection simply leaves the data unchanged.
 */

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

// Optional so forms that omit the field (e.g. quick-create lesson, which
// only posts title fields) still validate; absent and empty both mean null.
const text = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? v : null));

// Unchecked checkboxes are absent from FormData entirely; treat that as false.
const checkbox = z.coerce.boolean().default(false);

const courseSchema = z.object({
  title: z.string().trim().min(2).max(200),
  title_en: text,
  description: text,
  description_en: text,
  is_published: checkbox,
  beta_open: checkbox,
});

function refresh() {
  revalidatePath("/", "layout");
}

// Videos live in R2, not the database — deleting rows alone would orphan
// the objects and keep paying for storage. Rows are deleted first; if the
// R2 delete then fails, a stray object is the harmless failure mode.
async function deleteMediaObjects(keys: Array<string | null>) {
  const valid = keys.filter((key): key is string => Boolean(key));
  if (valid.length === 0) return;
  try {
    const media = getCloudflareContext().env.MEDIA;
    // R2 bulk delete caps at 1000 keys per call.
    for (let i = 0; i < valid.length; i += 1000) {
      await media.delete(valid.slice(i, i + 1000));
    }
  } catch (error) {
    // Orphaned objects; log the keys so they can be removed in the R2
    // dashboard (object keys carry no PII).
    console.error("R2 cleanup failed for keys:", valid, error);
  }
}

// ------------------------------------------------------------------ courses

export async function createCourse(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { error } = await ctx.supabase.from("courses").insert({
    ...parsed.data,
    slug: slugify(parsed.data.title),
  });
  if (error) return;
  refresh();
}

export async function updateCourse(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!id.success || !parsed.success) return;

  const { error } = await ctx.supabase
    .from("courses")
    .update(parsed.data)
    .eq("id", id.data);
  if (error) return;
  refresh();
}

export async function deleteCourse(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  // Collect video keys before the cascade wipes the lesson rows.
  const { data: lessons } = await ctx.supabase
    .from("lessons")
    .select("video_key, modules!inner(course_id)")
    .eq("modules.course_id", id.data);

  // .select() proves rows were actually deleted — a silent 0-row delete
  // (e.g. RLS filtering) must not trigger the irreversible R2 cleanup.
  const { data: deleted, error } = await ctx.supabase
    .from("courses")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error || !deleted?.length) return;

  await deleteMediaObjects(
    ((lessons ?? []) as Array<{ video_key: string | null }>).map((l) => l.video_key),
  );
  refresh();
  redirect({ href: "/admin", locale: await getLocale() });
}

// ------------------------------------------------------------------ modules

const moduleSchema = z.object({
  course_id: z.uuid(),
  title: z.string().trim().min(2).max(200),
  title_en: text,
});

export async function createModule(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const parsed = moduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { data: last } = await ctx.supabase
    .from("modules")
    .select("position")
    .eq("course_id", parsed.data.course_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const { error } = await ctx.supabase
    .from("modules")
    .insert({ ...parsed.data, position: (last?.position ?? 0) + 1 });
  if (error) return;
  refresh();
}

export async function updateModule(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = moduleSchema
    .omit({ course_id: true })
    .safeParse(Object.fromEntries(formData));
  if (!id.success || !parsed.success) return;

  const { error } = await ctx.supabase
    .from("modules")
    .update(parsed.data)
    .eq("id", id.data);
  if (error) return;
  refresh();
}

export async function deleteModule(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  // Collect video keys before the cascade wipes the lesson rows.
  const { data: lessons } = await ctx.supabase
    .from("lessons")
    .select("video_key")
    .eq("module_id", id.data);

  const { data: deleted, error } = await ctx.supabase
    .from("modules")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error || !deleted?.length) return;

  await deleteMediaObjects(
    ((lessons ?? []) as Array<{ video_key: string | null }>).map((l) => l.video_key),
  );
  refresh();
}

export async function moveModule(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  const dir = z.enum(["up", "down"]).safeParse(formData.get("dir"));
  if (!id.success || !dir.success) return;

  const { data: current } = await ctx.supabase
    .from("modules")
    .select("id, course_id, position")
    .eq("id", id.data)
    .single<{ id: string; course_id: string; position: number }>();
  if (!current) return;

  const { data: neighbor } = await ctx.supabase
    .from("modules")
    .select("id, position")
    .eq("course_id", current.course_id)
    .order("position", { ascending: dir.data === "down" })
    .filter("position", dir.data === "down" ? "gt" : "lt", current.position)
    .limit(1)
    .maybeSingle<{ id: string; position: number }>();
  if (!neighbor) return; // already at the edge

  await ctx.supabase
    .from("modules")
    .update({ position: neighbor.position })
    .eq("id", current.id);
  await ctx.supabase
    .from("modules")
    .update({ position: current.position })
    .eq("id", neighbor.id);
  refresh();
}

// ------------------------------------------------------------------ lessons

const lessonSchema = z.object({
  module_id: z.uuid(),
  title: z.string().trim().min(2).max(200),
  title_en: text,
  description: text,
  description_en: text,
});

export async function createLesson(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const parsed = lessonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { data: last } = await ctx.supabase
    .from("lessons")
    .select("position")
    .eq("module_id", parsed.data.module_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();

  const { error } = await ctx.supabase.from("lessons").insert({
    ...parsed.data,
    slug: slugify(parsed.data.title),
    position: (last?.position ?? 0) + 1,
  });
  if (error) return;
  refresh();
}

export async function updateLesson(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = lessonSchema
    .omit({ module_id: true })
    .safeParse(Object.fromEntries(formData));
  if (!id.success || !parsed.success) return;

  const duration = z.coerce
    .number()
    .int()
    .min(0)
    .max(60 * 60 * 24)
    .nullable()
    .catch(null)
    .parse(formData.get("duration_seconds") || null);

  const { error } = await ctx.supabase
    .from("lessons")
    .update({ ...parsed.data, duration_seconds: duration })
    .eq("id", id.data);
  if (error) return;
  refresh();
}

export async function deleteLesson(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const { data: lesson } = await ctx.supabase
    .from("lessons")
    .select("video_key")
    .eq("id", id.data)
    .maybeSingle<{ video_key: string | null }>();

  const { data: deleted, error } = await ctx.supabase
    .from("lessons")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error || !deleted?.length) return;

  await deleteMediaObjects([lesson?.video_key ?? null]);
  refresh();
}

export async function moveLesson(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  const dir = z.enum(["up", "down"]).safeParse(formData.get("dir"));
  if (!id.success || !dir.success) return;

  const { data: current } = await ctx.supabase
    .from("lessons")
    .select("id, module_id, position")
    .eq("id", id.data)
    .single<{ id: string; module_id: string; position: number }>();
  if (!current) return;

  const { data: neighbor } = await ctx.supabase
    .from("lessons")
    .select("id, position")
    .eq("module_id", current.module_id)
    .order("position", { ascending: dir.data === "down" })
    .filter("position", dir.data === "down" ? "gt" : "lt", current.position)
    .limit(1)
    .maybeSingle<{ id: string; position: number }>();
  if (!neighbor) return;

  await ctx.supabase
    .from("lessons")
    .update({ position: neighbor.position })
    .eq("id", current.id);
  await ctx.supabase
    .from("lessons")
    .update({ position: current.position })
    .eq("id", neighbor.id);
  refresh();
}
