import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Public delivery of blog cover images from R2. Only keys under the blog/
 * prefix are reachable — course videos in the same bucket stay private
 * behind the platform's entitlement-checked media route. Keys embed an
 * upload timestamp, so responses can be cached as immutable.
 */

const KEY_PATTERN = /^blog\/[a-z0-9-]+\.(jpe?g|png|webp)$/;

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");
  if (!KEY_PATTERN.test(objectKey)) {
    return new Response("Not found", { status: 404 });
  }

  const { env } = getCloudflareContext();
  const object = await env.MEDIA.get(objectKey);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const ext = objectKey.split(".").pop() ?? "jpg";
  return new Response(object.body, {
    headers: {
      // Prefer the type stored on the object — a replaced cover can hold
      // WebP bytes under a key minted with the original upload's extension.
      "Content-Type":
        object.httpMetadata?.contentType ?? CONTENT_TYPES[ext] ?? "image/jpeg",
      // Keys are re-minted on every upload, so a day of caching behaves as
      // immutable — while covers of deleted posts age out of caches quickly.
      "Cache-Control": "public, max-age=86400",
    },
  });
}
