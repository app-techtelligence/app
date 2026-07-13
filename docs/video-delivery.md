# Video delivery — architecture, scaling, and the known upgrade path

How lesson video is stored and served on the course platform (`apps/platform`),
why it broke once, what we did about it, and exactly what to do when we need to
scale further. Read this before touching the media route, the upload pipeline,
or when planning for growth.

_Last reviewed: 2026-07-13. Owner: platform._

---

## 1. How it works today

```
<video> (lesson page)
   │  GET /api/media/[lessonId]   (HTTP Range requests)
   ▼
Cloudflare Worker  ── app/api/media/[lessonId]/route.ts
   │  1. supabase.auth.getUser()          (validate session)
   │  2. lesson + enrollment + role check  (~3 Supabase queries per request)
   │  3. env.MEDIA.get(video_key, {range}) then stream the bytes back
   ▼
Cloudflare R2  (bucket "techtelligence-media", binding MEDIA)
```

- **Storage:** raw MP4 objects in R2. Key format for admin uploads is
  `${courseSlug}/${lessonSlug}-${Date.now()}.mp4`; the original seed lesson uses
  `linkedin/Linkedin.mp4`. The lesson row's `video_key` column points at it.
- **Auth:** the route is entitlement-gated — enrolled-active **or** admin — and
  re-checks on **every** request. `Cache-Control: private, no-store`, so the
  Cloudflare edge caches nothing: every byte of every playback re-fetches from
  R2 through the Worker.
- **Upload:** admin-only multipart upload to R2 in 32 MiB chunks
  (`app/api/admin/upload/route.ts`). `duration_seconds` is currently sent by the
  client and trusted (see Known limitations).
- **Why a Worker in the path at all:** so we can enforce enrollment before
  serving protected content. R2 objects are never publicly reachable.

This is deliberately the pre-payments MVP. The intended upgrade (Cloudflare
Stream) is in CLAUDE.md §2/§6 and detailed in §6 below.

---

## 2. The Error 1102 incident (2026-07-12) and the fix

**Symptom:** intermittent Cloudflare **Error 1102 "Worker exceeded resource
limits"** on the platform, sometimes on a normal page load.

**Root cause (confirmed):** the media route returned the **entire video file**
(~217 MB) in a single response for the two most common client requests — the
browser's opening `Range: bytes=0-` probe (the regex left the end group empty,
so R2 was read from offset 0 to EOF) and any non-Range `GET`. On its own that
would be fine if it streamed cleanly, but:

- Workers have a hard **128 MB memory limit per isolate, shared across all
  concurrent requests** on that isolate.
- OpenNext's Cloudflare stream wrapper (`@opennextjs/aws/.../cloudflare-node.js`)
  pumps the body with `controller.enqueue(chunk)` and **never checks
  `desiredSize`** — there is no end-to-end backpressure. (It does *not* buffer
  deliberately — `retainChunks: false` — so a single fast reader is fine.)
- Normal `<video>` behaviour is to buffer a forward window, then **pause reading
  the socket** (TCP backpressure). When the client pauses, Cloudflare stops
  pulling the response, but the producer keeps reading R2 and enqueuing, so the
  undrained bytes pile up **in isolate memory** toward the full file size.

One stalled full-file playback can approach 128 MB by itself; a couple of
co-located ones reliably exceed it → 1102. The intermittency is the
shared-isolate lottery (file size × whether the client stalls × how many heavy
streams land on one isolate).

**The fix (shipped):** clamp every response to a bounded window (`MAX_CHUNK =
4 MB`) in `app/api/media/[lessonId]/route.ts`. We `HEAD` the object for its true
size, return a correct `206` with `Content-Range`/`Content-Length` equal to the
bytes actually returned, add proper `416` handling for unsatisfiable ranges, and
take the content type from R2 metadata. Per-request memory is now a few MB
regardless of file size or client behaviour, so concurrent playbacks can no
longer stack toward 128 MB. The player pulls later windows via follow-up Range
requests (standard HTTP range streaming).

**How to confirm memory vs CPU for a future 1102:** Cloudflare Dashboard →
Workers & Pages → `platform` → Observability → Logs; filter by the Ray ID and
read the invocation `outcome` (`exceededMemory` / `exceededCpu` /
`exceptionThrown`). Logs retain ~3 days.

---

## 3. Compression — keep source files small (and faststart)

The Workers runtime **cannot** run ffmpeg/codecs, and the browser can't
practically transcode a full lesson, so **compression happens on the author's
machine before upload.** Standardize on **H.264** — it is the only codec a
single `<video src>` plays in every browser (H.265/AV1 save another 30–60% but
aren't universally decodable until we move to adaptive bitrate, i.e. Stream).

**Talking-head lesson (downscale to 720p):**

```bash
ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 21 -profile:v high \
  -pix_fmt yuv420p -vf scale=-2:720 -c:a aac -b:a 128k -movflags +faststart out.mp4
```

**Screen-share / code lesson (keep 1080p, lower CRF so text stays legible):**
use `-vf scale=-2:1080` and `-crf 19`.

- **CRF, not two-pass** — a course wants consistent perceptual quality, not a
  byte ceiling, and CRF is half the encode time.
- **`+faststart` is mandatory** — it moves the `moov` (seek index) atom to the
  front so `preload="metadata"` and seeking start instantly instead of deep-
  reading the file tail. A tail-heavy `moov` also worsens the 1102 memory
  pattern.
- **Expected reduction:** ~50–70% on raw screen recordings (a 217 MB seed →
  ~40–80 MB).

**Replace an object in place (no DB change — same key keeps `video_key` valid),
from `apps/platform`:**

```bash
npx wrangler r2 object put "techtelligence-media/<video_key>" \
  --file out.mp4 --content-type video/mp4 --remote
```

Do **not** attempt compression in the Worker (no codecs) or the browser
(WebCodecs is too slow/memory-fragile for full lessons). Once on Cloudflare
Stream, skip ffmpeg entirely — Stream transcodes every upload automatically.

---

## 4. Scalability — what happens under concurrent load

R2 is **never** the bottleneck (egress is free and it's built for high concurrent
single-object reads). The Worker-in-the-byte-path is the ceiling.

| Concurrent viewers, same video | Before the clamp | After the 4 MB clamp | After Cloudflare Stream |
|---|---|---|---|
| **10** | can crash (1102) | **safe** (≤~40 MB across one isolate) | trivial |
| **100** | crashes | works, but strains Supabase auth | trivial |
| **1000** | crashes | **hits Supabase GoTrue auth rate limits** | trivial (served from CDN) |

Two structural limits the clamp does **not** remove:

1. **No edge caching / no dedup.** `private, no-store` means 10 students watching
   the same video = 10× full re-fetch from R2 through the Worker.
2. **Auth amplification.** The clamp turns one full view into ~50+ range
   requests, and **each** currently runs `getUser()` + enrollment + role
   queries. At 100+ concurrent viewers, Supabase's auth server — not Workers or
   R2 — becomes the wall.

(Note: the old 1,000-subrequest/invocation Workers cap was removed in Feb 2026;
subrequests are a non-issue. The wall is Supabase auth.)

---

## 5. Known limitations / tech debt in the current pipeline

Tracked here so we don't rediscover them. Ordered roughly by priority.

- **Auth check duplicated ×3 and ignores `is_free_preview`.** The "enrolled OR
  admin" logic is copy-pasted in the media route, the lesson page, and the
  course page, and none honor `lessons.is_free_preview`, so the documented
  free-preview capability (CLAUDE.md §9) silently doesn't work. → extract one
  `hasLessonAccess()` helper and include the preview branch.
- **`getUser()` in the media hot path.** It round-trips to Supabase GoTrue on
  every range request. Switch the hot path to `getClaims()` (local JWKS
  verification) to drop a network hop per request.
- **`duration_seconds` is client-supplied and trusted** (`admin/upload` route).
  It comes back `null`/`NaN` on non-faststart files — which is why the seed
  lesson's duration is blank. Parse the MP4 `mvhd`/`moov` server-side, or take
  duration from Stream once migrated.
- **Upload route error handling.** `upload.complete()` / `uploadPart()` are
  unguarded → unhandled 500s; the multipart isn't aborted on failure.
- **Orphaned multipart uploads.** A tab closed mid-upload leaves billable parts
  with no cleanup. Add an R2 lifecycle rule to auto-abort incomplete multipart
  uploads after ~1–2 days; make the client abort reliable via
  `navigator.sendBeacon` on `beforeunload`.
- **No load testing.** Platform tests are message-parity only. Add a k6/artillery
  test that opens N concurrent range-streamed sessions and asserts bounded
  memory + p95 latency before shipping clamp/token changes.
- **Observability enabled but unwatched.** `wrangler.jsonc` has
  `observability.enabled` but nothing consumes it — the 1102 was found by users.
  Add a Cloudflare notification on Worker error rate + CPU/memory, plus
  PII-free structured logging in the media route keyed by `lessonId`.

---

## 6. Target architecture — Cloudflare Stream (the scale answer)

When we want the platform genuinely scalable and low-ops, **migrate lesson video
to Cloudflare Stream.** It solves compression, concurrency, and access control
at once, and takes the Worker out of the byte path entirely.

**How it works:**

- Upload each lesson once → Stream **auto-transcodes to an adaptive-bitrate
  360p–1080p HLS/DASH ladder** (compression + faststart handled; the client
  picks the rendition for its bandwidth) and serves from Cloudflare's **global
  CDN**. The Worker never streams a byte, so the 128 MB-isolate crash surface
  and the cache-waste both disappear.
- **Entitlement stays exactly where it is.** Set `requireSignedURLs: true` per
  video so public URLs stop working; keep the enrollment check on the lesson
  page, but have it **mint a short-lived signed token** (Workers Stream binding
  `env.STREAM.video(uid).generateToken()`, or the JWT signing-key path for
  longer expiry / IP rules) **only for entitled users**. The thing being gated
  changes from *bytes* to a *token* — and the auth-amplification problem
  (§4) never arises, because entitlement is checked once at page load, not per
  byte-range.
- Store the Stream video UID on the lesson row; swap the client `<video src>`
  for the Stream player / HLS manifest built from the token; take
  `duration_seconds` from Stream's API.

**Migration steps (when we do it):**

1. Add a Stream binding to `apps/platform/wrangler.jsonc`.
2. Change the admin upload flow to push to Stream (direct-creator-upload or the
   API) instead of R2 multipart; set `requireSignedURLs: true`.
3. Add a `stream_uid` column to `lessons` (migration); backfill by re-uploading
   existing videos.
4. Media page: replace the enrollment→bytes path with enrollment→mint-token; the
   `/api/media` route becomes a token minter (or is removed in favour of a
   server-component token).
5. Swap the player; pull duration from Stream.
6. Remove the R2 video objects once migrated (keep R2 for blog covers).

**Cost (verified against 2026 Cloudflare docs):** ingest + encoding free;
**storage $5 / 1,000 minutes stored** (≈ $0.30 per hour of content per month;
renditions do **not** add to stored minutes); **delivery $1 / 1,000 minutes
delivered** (≈ $0.06 per hour watched). A 10-hour course ≈ **$3/mo storage**; at
10 students each watching it fully, ≈ **$6 delivery** → well under **$10/month**.
Delivery scales linearly with watch-minutes, so revisit the math only at serious
volume (e.g. 1,000 students × a 10-hour course/month ≈ ~$600/mo delivery) — by
which point the R2+Worker path would need its own significant caching/token
engineering to even survive. At beta/early scale, Stream is a few dollars a month
and the right call.

---

## 7. Roadmap

| Phase | Action | Effort / Impact |
|---|---|---|
| **immediate** | Range-clamp fix (§2) — **done** | trivial / critical |
| **immediate** | Re-encode + re-upload the seed video, faststart (§3) | small / high |
| **immediate** | Document the ffmpeg preset as an authoring convention (§3) | trivial / high |
| **near-term** | `hasLessonAccess()` helper + `is_free_preview`; `getUser`→`getClaims` (§5) | small / medium |
| **near-term** | Upload route hardening + server-side duration (§5) | small / medium |
| **near-term** | Observability alerts + media error logging (§5) | small / medium |
| **near-term** | R2 lifecycle rule for orphaned multipart; reliable client abort (§5) | trivial / low |
| **near-term** | Load test (k6/artillery) for concurrent playback (§5) | medium / medium |
| **target** | Migrate to Cloudflare Stream (§6) | large / critical |

Everything before the Stream migration is a bridge that buys time. The clamp
stops the crashes; Stream is the durable answer.
