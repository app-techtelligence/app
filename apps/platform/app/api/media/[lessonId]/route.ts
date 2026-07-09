import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth-gated video streaming from R2 (CLAUDE.md §8 v2: protected course
 * content, entitlement checked server-side). Supports HTTP Range requests
 * so the <video> element can seek. Replaceable by Cloudflare Stream signed
 * URLs when budget allows adaptive bitrate.
 */

type LessonAccessRow = {
  video_key: string | null;
  is_free_preview: boolean;
  modules: { course_id: string };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const { lessonId } = await params;

  // 1. Who is asking?
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Which video, and is this user entitled to it?
  const { data: lesson } = await supabase
    .from("lessons")
    .select("video_key, is_free_preview, modules!inner(course_id)")
    .eq("id", lessonId)
    .single<LessonAccessRow>();

  if (!lesson?.video_key) {
    return new Response("Not found", { status: 404 });
  }

  if (!lesson.is_free_preview) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("status")
      .eq("user_id", user.id)
      .eq("course_id", lesson.modules.course_id)
      .eq("status", "active")
      .maybeSingle();
    if (!enrollment) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // 3. Stream from R2, honoring Range for seeking.
  const { env } = getCloudflareContext();
  const rangeHeader = request.headers.get("range");
  const baseHeaders: Record<string, string> = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Type": "video/mp4",
  };

  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
    if (!match) {
      return new Response("Invalid range", { status: 416 });
    }
    const offset = Number(match[1]);
    const object = await env.MEDIA.get(lesson.video_key, {
      range: match[2]
        ? { offset, length: Number(match[2]) - offset + 1 }
        : { offset },
    });
    if (!object) {
      return new Response("Not found", { status: 404 });
    }
    const end = match[2] ? Number(match[2]) : object.size - 1;
    return new Response(object.body, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${offset}-${end}/${object.size}`,
        "Content-Length": String(end - offset + 1),
      },
    });
  }

  const object = await env.MEDIA.get(lesson.video_key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(object.body, {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(object.size),
    },
  });
}
