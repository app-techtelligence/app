---
name: seo-audit
description: Technical + on-page SEO audit of the live techtelligence.net — metadata, hreflang, sitemap coverage, structured data, internal links, covers, performance. Use when the user asks to audit SEO, diagnose traffic/ranking problems, or after significant site changes. Reports prioritized findings and offers to implement fixes.
---

# SEO audit — techtelligence.net

Audit the LIVE site (not just the code): what Google's crawler sees is what counts. Report findings as Critical / High / Nice-to-have, each with the fix and the file that implements it. Offer to fix; don't just list.

## Checks, in order

1. **Indexability basics**
   - `curl -s https://techtelligence.net/robots.txt` — must not block marketing pages; platform (plataforma.) stays noindex.
   - `curl -s https://techtelligence.net/sitemap.xml | grep -oE "<loc>[^<]+"` — every live blog post present in BOTH locales (compare against `/blog` listing). Verified working 2026-07-10; regression here is Critical.

2. **Per-page on-page** (loop over sitemap URLs, or spawn the `seo-auditor` agent to fan out):
   - exactly one `<h1>`; `<title>` ≤ ~60 chars; meta description present, 140–170 chars (posts: the excerpt);
   - `rel=canonical` self-referencing; `hreflang` pair (pt-BR + en + x-default) pointing at the right per-locale slugs;
   - `og:title/description/image` present; og:image reachable, `image/webp`, < 5 MB (full covers audit lives in `/blog-cover`).

3. **Structured data** — `curl -s <post-url> | grep -c "application/ld+json"`. **Known gap (2026-07-10): posts have no Article JSON-LD.** Fix when prioritized: emit `Article` schema (headline, datePublished, dateModified, image, author = Organization TechTelligence, inLanguage) from `apps/web/app/[locale]/blog/[slug]/page.tsx`. Also worth adding: `Organization` + `WebSite` on the homepage, `FAQPage` on posts with question-H2 sections that genuinely answer.

4. **Internal linking** — every post should have ≥2 links pointing TO it from other posts (orphan posts rank poorly). Check by grepping the live bodies or the seeds in `apps/platform/supabase/content/`. Report orphans to feed back into `/seo-strategy`.

5. **Performance** — marketing pages must stay fully static (CLAUDE.md §8) with Lighthouse ≥ 90 mobile. For a deep pass, load the `web-perf` skill (Core Web Vitals via Chrome DevTools). Quick proxy: `curl -s -o /dev/null -w "%{time_total}"` on key pages (< 1s cold).

6. **Freshness signals** — posts updated meaningfully should bump `updated_at` (rendered + sitemap lastmod). Stale plan: revisit posts > 6 months old via `/seo-strategy`.

## User-side checks (can't be done from here — remind, don't skip silently)

- **Google Search Console**: property verified, sitemap submitted, no manual actions, coverage report clean. GSC query data is the single most valuable SEO input — nag until it exists.
- Bing Webmaster Tools (free Bing/DuckDuckGo/ChatGPT-search traffic; imports from GSC in one click).
- Google Business Profile if local leads matter for the consultancy.

## Output format

Ranked findings table (severity, what, where, fix), then a one-paragraph "biggest lever right now" recommendation. If the user says fix: implement code fixes directly (conventions in CLAUDE.md §5.1/§8), content fixes via UPDATE seeds or the admin editor.
