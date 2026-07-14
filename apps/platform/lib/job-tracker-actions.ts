"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  JOB_DATE_FIELDS,
  JOB_SOURCES,
  JOB_STAGES,
  JOB_STATUSES,
} from "@/lib/job-tracker";

/**
 * Student job-tracker mutations. Every action re-checks the session
 * server-side and scopes the query to the caller's own rows; RLS enforces
 * ownership again at the database (defense in depth). Unlike the admin
 * actions, create/update return { ok } — the student's typed-in data must
 * not vanish silently, so the forms keep their input and show an error when
 * ok is false. Move/status/delete stay void: they carry no typed input and
 * the board's optimistic state simply snaps back on the next revalidation.
 */

const text = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v : null));

// Notes are a free-text scratchpad (interview feedback, contacts, next
// steps) — allow multiple paragraphs, unlike the single-line text fields.
const notes = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((v) => (v ? v : null));

// Students paste addresses in every shape ("empresa.com.br") — prefix the
// scheme so the card link always opens, then reject what still isn't a URL.
const websiteUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : null))
  .refine((v) => {
    if (v === null) return true;
    try {
      const url = new URL(v);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  });

// <input type="date"> posts YYYY-MM-DD or an empty string.
const isoDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v));

const applicationSchema = z.object({
  company_name: z.string().trim().min(1).max(200),
  contact_name: text,
  website_url: websiteUrl,
  salary: text,
  notes: notes,
  stage: z.enum(JOB_STAGES).default("first_contact"),
  status: z.enum(JOB_STATUSES).default("waiting"),
  source: z.enum(JOB_SOURCES).default("active"),
});

// The date columns are handled apart from the schema: the form only renders
// the one date that matches the current stage, so an edit posts a single date
// key. Parsing only the keys that are present keeps a stage move from nulling
// the other stages' interview dates. Returns null on a malformed date.
function parseDatePatch(
  formData: FormData,
): Record<string, string | null> | null {
  const patch: Record<string, string | null> = {};
  for (const field of JOB_DATE_FIELDS) {
    if (!formData.has(field)) continue;
    const parsed = isoDate.safeParse(formData.get(field));
    if (!parsed.success) return null;
    patch[field] = parsed.data;
  }
  return patch;
}

async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

function refresh() {
  revalidatePath("/", "layout");
}

export async function createApplication(
  formData: FormData,
): Promise<{ ok: boolean }> {
  const ctx = await getUserContext();
  if (!ctx) return { ok: false };

  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  const dates = parseDatePatch(formData);
  if (!parsed.success || !dates) return { ok: false };

  const { error } = await ctx.supabase
    .from("job_applications")
    .insert({ ...parsed.data, ...dates, user_id: ctx.user.id });
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}

export async function updateApplication(
  formData: FormData,
): Promise<{ ok: boolean }> {
  const ctx = await getUserContext();
  if (!ctx) return { ok: false };

  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  const dates = parseDatePatch(formData);
  if (!id.success || !parsed.success || !dates) return { ok: false };

  const { error } = await ctx.supabase
    .from("job_applications")
    .update({ ...parsed.data, ...dates, updated_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("user_id", ctx.user.id);
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}

/** Kanban move: only the stage changes (drag & drop or the arrow buttons). */
export async function moveApplication(formData: FormData) {
  const ctx = await getUserContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  const stage = z.enum(JOB_STAGES).safeParse(formData.get("stage"));
  if (!id.success || !stage.success) return;

  const { error } = await ctx.supabase
    .from("job_applications")
    .update({ stage: stage.data, updated_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("user_id", ctx.user.id);
  if (error) return;
  refresh();
}

/** Waiting ↔ no-return toggle from the card's status chip. */
export async function setApplicationStatus(formData: FormData) {
  const ctx = await getUserContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  const status = z.enum(JOB_STATUSES).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;

  const { error } = await ctx.supabase
    .from("job_applications")
    .update({ status: status.data, updated_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("user_id", ctx.user.id);
  if (error) return;
  refresh();
}

export async function deleteApplication(formData: FormData) {
  const ctx = await getUserContext();
  if (!ctx) return;

  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const { error } = await ctx.supabase
    .from("job_applications")
    .delete()
    .eq("id", id.data)
    .eq("user_id", ctx.user.id);
  if (error) return;
  refresh();
}
