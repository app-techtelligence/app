---
name: blog-cover
description: Blog cover images for techtelligence.net — generate Gemini image prompts in the approved house style, and/or process delivered images (crop to 1200×630 WebP, upload or replace in R2). Use when the user asks for cover images, image prompts for a post, or reports a broken social/link preview.
---

# Blog cover pipeline

Covers live in R2 (bucket `techtelligence-media`, `blog/` prefix), referenced by `posts.cover_key`, served via the web route `/api/blog-media/[...key]`, and double as the post's `og:image`. Two modes — generate prompts, and process the images that come back.

## Hard constraints (why this pipeline exists)

- **Text-free, no logo, no faces** — one cover serves both PT and EN, AI-rendered text comes out mangled, and the title already renders on the card and in link previews. People only as silhouettes or seen from behind.
- **og:image over 5 MB breaks LinkedIn** ("Cannot display preview. You can post as is…"). Raw AI exports are 6–8 MB. Target: **1200×630 WebP under ~150 KB**.
- The Workers runtime can't run image codecs — processing happens locally (sharp) or in the browser (the admin `CoverUploader` auto-compresses anything > 500 KB).
- The user prefers AI editorial illustrations (decision 2026-07-10). The geometric generator `apps/web/scripts/generate-blog-covers.mjs` exists but was rejected as the default style — don't reach for it unless asked.

## Mode A — Gemini prompts

Give the user one prompt per post: the style base + a scene clause. Prompts in English (Gemini follows them more reliably).

Style base (approved by the user — keep it stable so covers look like one family):

```text
Premium editorial illustration for a technology consulting blog. Dark navy blue night palette (#1A2A44) with warm amber-orange glow accents (#F59E0B). Cinematic lighting, depth, modern digital art style, clean composition with negative space on the left side. Widescreen 16:9. No text, no words, no letters, no numbers, no logos, no watermarks.

Scene: [SCENE]
```

Scene clause: ONE concrete visual metaphor for the post's core idea. Proven examples: a winding glowing path toward a bright horizon (getting started); a holographic balance scale with data cubes vs. coins (cost); chaotic documents flowing through a glowing gate into ordered streams (data readiness); a silhouetted person climbing a staircase of glowing screens (career growth); three diverging luminous paths (role comparison).

Practical advice to pass along: generate all covers in the same Gemini session; make 2–4 variants and pick; if the first image nails the style, tell Gemini "keep this exact visual style for the next images".

## Mode B — process delivered images

1. User drops originals into `blog-covers/` at the repo root (gitignored — nothing there ever reaches GitHub).
2. Compress with sharp (available via `apps/web` dependencies; run node from inside the repo so it resolves):
   ```js
   sharp(src).resize(1200, 630, { fit: "cover", position: "attention" }).webp({ quality: 82 }).toFile(out)
   ```
3. **Read the output image to verify the crop** didn't cut the subject; name files after the post's PT slug.
4. Get it live:
   - **New cover** → user uploads via the admin editor (`plataforma.techtelligence.net/admin/blog/[id]`). The uploader compresses client-side too, but a pre-sized file is better.
   - **Replace an existing cover without touching the DB** → find the key in the post page's `og:image` URL, then (wrangler is authenticated on this machine):
     ```
     cd apps/platform && npx wrangler r2 object put "techtelligence-media/blog/<key>" --file <file.webp> --content-type image/webp --remote
     ```
     Same key = `cover_key` stays valid; the media route serves the object's stored content type.
5. Verify live: `curl -s -o /dev/null -w "%{size_download} %{content_type}" <og:image URL>` → expect `image/webp`, well under 5 MB.
6. Remind the user about share-preview caches: social crawlers scrape a URL once and reuse the result for ~a week, so a preview that failed (or showed the old cover) stays broken until re-scraped. Per network:
   - **LinkedIn** → Post Inspector: https://www.linkedin.com/post-inspector/ (paste URL = forced re-scrape + preview check).
   - **Facebook/Instagram** → Sharing Debugger: https://developers.facebook.com/tools/debug/ (use "Scrape Again").
   - **X** → the Card Validator was retired; no official refresh tool. Workaround: share the URL with a throwaway query string (e.g. `?v=2`) so X treats it as a new page.
   Only needed when the URL was shared (or a share was attempted) before a fix — but it's also a good pre-flight for brand-new posts: it confirms title, description and image resolve before followers see the card.

## Auditing all covers at once

```bash
for slug in $(curl -s https://techtelligence.net/blog | grep -oE 'href="/blog/[a-z0-9-]+"' | sed 's/href="\/blog\///;s/"//'); do
  img=$(curl -s "https://techtelligence.net/blog/$slug" | grep -oE '<meta property="og:image" content="[^"]*"' | sed 's/.*content="//;s/"//')
  echo "$slug: $(curl -s -o /dev/null -w '%{size_download}B %{content_type}' "$img")"
done
```

Anything over ~500 KB or not `image/webp` gets the Mode B treatment.
