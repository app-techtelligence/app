import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { getAdminContext } from "@/lib/admin";

/**
 * Admin-only blog cover image upload/preview:
 *   POST ?postId=  (binary image body)  -> { key }   (replaces + deletes old)
 *   GET  ?postId=                        -> the current cover (editor preview)
 * Covers are small (8 MB cap), so a single-shot upload is enough — no
 * multipart. Public delivery happens on the marketing site's /api/blog-media.
 */

const MAX_BYTES = 8 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const postId = z.uuid().safeParse(request.nextUrl.searchParams.get("postId"));
  if (!postId.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const ext = EXTENSIONS[contentType];
  if (!ext) return NextResponse.json({ error: "unsupported_type" }, { status: 415 });

  // Reject oversized uploads before buffering the body.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  if (body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const { data: post } = await ctx.supabase
    .from("posts")
    .select("id, cover_key")
    .eq("id", postId.data)
    .maybeSingle<{ id: string; cover_key: string | null }>();
  if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { env } = getCloudflareContext();
  const key = `blog/${post.id}-${Date.now()}.${ext}`;
  await env.MEDIA.put(key, body, { httpMetadata: { contentType } });

  const { error } = await ctx.supabase
    .from("posts")
    .update({ cover_key: key })
    .eq("id", post.id);
  if (error) {
    await env.MEDIA.delete(key);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  if (post.cover_key && post.cover_key !== key) {
    // Cleanup failure must not fail an otherwise-successful upload.
    try {
      await env.MEDIA.delete(post.cover_key);
    } catch (cleanupError) {
      console.error("R2 cleanup failed for key:", post.cover_key, cleanupError);
    }
  }
  return NextResponse.json({ key });
}

export async function GET(request: NextRequest) {
  const ctx = await getAdminContext();
  if (!ctx) return new Response("Forbidden", { status: 403 });

  const postId = z.uuid().safeParse(request.nextUrl.searchParams.get("postId"));
  if (!postId.success) return new Response("Bad request", { status: 400 });

  const { data: post } = await ctx.supabase
    .from("posts")
    .select("cover_key")
    .eq("id", postId.data)
    .maybeSingle<{ cover_key: string | null }>();
  if (!post?.cover_key) return new Response("Not found", { status: 404 });

  const { env } = getCloudflareContext();
  const object = await env.MEDIA.get(post.cover_key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}
