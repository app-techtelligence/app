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
    .select("video_key, modules!inner(course_id)")
    .eq("id", lessonId)
    .single<LessonAccessRow>();

  if (!lesson?.video_key) {
    return new Response("Not found", { status: 404 });
  }

  const [{ data: enrollment }, { data: profile }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("status")
      .eq("user_id", user.id)
      .eq("course_id", lesson.modules.course_id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>(),
  ]);
  if (!enrollment && profile?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  // 3. Stream from R2 as bounded windows, honoring Range for seeking.
  //
  // Every response is capped at MAX_CHUNK bytes — never the whole file. The
  // Workers isolate has a hard 128 MB memory limit shared across concurrent
  // requests, and the OpenNext stream wrapper enqueues without checking
  // backpressure, so a paused <video> on a full-file response would pile the
  // undrained bytes into memory until the isolate is killed (Cloudflare Error
  // 1102). Clamping keeps each in-flight response tiny regardless of file size
  // or how the client behaves; the player pulls later windows via follow-up
  // Range requests. See docs/video-delivery.md for the full analysis and the
  // Cloudflare Stream migration that removes the worker from the byte path.
  const { env } = getCloudflareContext();
  const MAX_CHUNK = 4 * 1024 * 1024; // 4 MB per response.

  // HEAD first for the true size and content type, so the range math and the
  // 416 checks are correct without fetching any bytes.
  const head = await env.MEDIA.head(lesson.video_key);
  if (!head) {
    return new Response("Not found", { status: 404 });
  }
  const size = head.size;

  const baseHeaders: Record<string, string> = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Type": head.httpMetadata?.contentType ?? "video/mp4",
  };

  // Parse the requested range. A missing Range (or a syntactically odd one we
  // don't support, e.g. suffix "bytes=-N") starts the window at 0; the player
  // then continues with explicit ranges.
  let start = 0;
  let requestedEnd: number | null = null;
  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
    if (match) {
      start = Number(match[1]);
      requestedEnd = match[2] ? Number(match[2]) : null;
    }
  }

  // Unsatisfiable range → 416 with the resource size, per RFC 7233.
  if (start >= size || (requestedEnd !== null && requestedEnd < start)) {
    return new Response("Range not satisfiable", {
      status: 416,
      headers: { ...baseHeaders, "Content-Range": `bytes */${size}` },
    });
  }

  // Honor a smaller explicit end, otherwise cap the window at MAX_CHUNK.
  const requestedLast = requestedEnd !== null ? Math.min(requestedEnd, size - 1) : size - 1;
  const end = Math.min(requestedLast, start + MAX_CHUNK - 1);
  const length = end - start + 1;

  const object = await env.MEDIA.get(lesson.video_key, {
    range: { offset: start, length },
  });
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(length),
    },
  });
}
