import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin";

/**
 * Admin-only chunked video upload to R2 via multipart:
 *   POST {op:"create", lessonId}                  -> { key, uploadId }
 *   PUT  ?key&uploadId&part=N  (binary chunk)     -> { partNumber, etag }
 *   POST {op:"complete", lessonId, key, uploadId, parts, durationSeconds}
 *   POST {op:"abort", key, uploadId}
 * Chunks stay well under the Workers request-body limit; parts must be
 * uniform size (client uses 32 MiB) except the last.
 */

const keySchema = z
  .string()
  .min(3)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9\-/]*\.mp4$/);

type LessonRow = {
  id: string;
  slug: string;
  video_key: string | null;
  modules: { courses: { slug: string } };
};

export async function POST(request: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const { env } = getCloudflareContext();

  const create = z
    .object({ op: z.literal("create"), lessonId: z.uuid() })
    .safeParse(body);
  if (create.success) {
    const { data: lesson } = await ctx.supabase
      .from("lessons")
      .select("id, slug, video_key, modules!inner(courses!inner(slug))")
      .eq("id", create.data.lessonId)
      .single<LessonRow>();
    if (!lesson) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const key = `${lesson.modules.courses.slug}/${lesson.slug}-${Date.now()}.mp4`;
    const upload = await env.MEDIA.createMultipartUpload(key, {
      httpMetadata: { contentType: "video/mp4" },
    });
    return NextResponse.json({ key: upload.key, uploadId: upload.uploadId });
  }

  const complete = z
    .object({
      op: z.literal("complete"),
      lessonId: z.uuid(),
      key: keySchema,
      uploadId: z.string().min(1).max(500),
      parts: z
        .array(z.object({ partNumber: z.number().int().min(1), etag: z.string() }))
        .min(1)
        .max(400),
      durationSeconds: z.number().int().min(0).max(86400).nullable(),
    })
    .safeParse(body);
  if (complete.success) {
    const { lessonId, key, uploadId, parts, durationSeconds } = complete.data;

    const { data: lesson } = await ctx.supabase
      .from("lessons")
      .select("id, slug, video_key, modules!inner(courses!inner(slug))")
      .eq("id", lessonId)
      .single<LessonRow & { video_key: string | null }>();
    if (!lesson) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // The key must be one minted by `create` for THIS lesson — prevents
    // cross-wiring a lesson to another lesson's object.
    const expectedPrefix = `${lesson.modules.courses.slug}/${lesson.slug}-`;
    if (!key.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "key_mismatch" }, { status: 400 });
    }

    const upload = env.MEDIA.resumeMultipartUpload(key, uploadId);
    await upload.complete(parts);

    const { error } = await ctx.supabase
      .from("lessons")
      .update({ video_key: key, duration_seconds: durationSeconds })
      .eq("id", lessonId);
    if (error) return NextResponse.json({ error: "db" }, { status: 500 });

    // Remove the replaced video, if any.
    if (lesson.video_key && lesson.video_key !== key) {
      await env.MEDIA.delete(lesson.video_key);
    }
    return NextResponse.json({ ok: true, key });
  }

  const abort = z
    .object({
      op: z.literal("abort"),
      key: keySchema,
      uploadId: z.string().min(1).max(500),
    })
    .safeParse(body);
  if (abort.success) {
    const upload = env.MEDIA.resumeMultipartUpload(abort.data.key, abort.data.uploadId);
    await upload.abort();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "validation" }, { status: 400 });
}

export async function PUT(request: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const key = keySchema.safeParse(searchParams.get("key"));
  const uploadId = z.string().min(1).max(500).safeParse(searchParams.get("uploadId"));
  const part = z.coerce.number().int().min(1).max(400).safeParse(searchParams.get("part"));
  if (!key.success || !uploadId.success || !part.success || !request.body) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const upload = env.MEDIA.resumeMultipartUpload(key.data, uploadId.data);
  const uploaded = await upload.uploadPart(part.data, request.body);
  return NextResponse.json({
    partNumber: uploaded.partNumber,
    etag: uploaded.etag,
  });
}
