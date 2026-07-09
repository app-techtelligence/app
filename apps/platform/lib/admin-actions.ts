"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const text = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v === "" ? null : v));

const courseSchema = z.object({
  title: z.string().trim().min(2).max(200),
  title_en: text,
  description: text,
  description_en: text,
  is_published: z.coerce.boolean(),
  beta_open: z.coerce.boolean(),
});

function refresh() {
  revalidatePath("/", "layout");
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

  const { error } = await ctx.supabase.from("courses").delete().eq("id", id.data);
  if (error) return;
  refresh();
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

  const { error } = await ctx.supabase.from("modules").delete().eq("id", id.data);
  if (error) return;
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
  is_free_preview: z.coerce.boolean(),
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

  const { error } = await ctx.supabase.from("lessons").delete().eq("id", id.data);
  if (error) return;
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
