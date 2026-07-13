"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Lesson-progress mutations. Every action re-checks the session server-side
 * and scopes the write to the caller's own rows; RLS enforces ownership (and
 * that the lesson belongs to a published course) again at the database.
 * Both return { ok } so the lesson player's optimistic "done" state can snap
 * back when the write fails.
 */

async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export async function markLessonDone(
  lessonId: string,
): Promise<{ ok: boolean }> {
  const ctx = await getUserContext();
  if (!ctx) return { ok: false };

  const id = z.uuid().safeParse(lessonId);
  if (!id.success) return { ok: false };

  // Idempotent: re-finishing a lesson (video end after a manual mark) is a
  // no-op instead of a duplicate-key error.
  const { error } = await ctx.supabase
    .from("lesson_progress")
    .upsert(
      { user_id: ctx.user.id, lesson_id: id.data },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function unmarkLessonDone(
  lessonId: string,
): Promise<{ ok: boolean }> {
  const ctx = await getUserContext();
  if (!ctx) return { ok: false };

  const id = z.uuid().safeParse(lessonId);
  if (!id.success) return { ok: false };

  const { error } = await ctx.supabase
    .from("lesson_progress")
    .delete()
    .eq("lesson_id", id.data)
    .eq("user_id", ctx.user.id);
  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}
