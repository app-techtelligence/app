---
name: blog-post
description: Create bilingual (PT-BR + EN) SEO blog posts for techtelligence.net from a topic ("assunto") or from an example post the user provides. Use when the user asks for new blog posts, articles, or SEO content. Produces a dated SQL content seed for the Supabase SQL editor.
---

# Blog post generator (bilingual, SEO-first)

Create publication-ready posts for the TechTelligence blog. Input: a topic, an audience hint, and/or an example post to imitate. Output: a dated SQL seed in `apps/platform/supabase/content/` — the user pastes it into the Supabase SQL editor (there is no direct DB access from here).

## Before writing

1. Read CLAUDE.md §1 (products/audiences), §3 (tone) and §5.1 (blog conventions) if not already in context.
2. List existing posts to avoid duplicates and to plan internal links:
   - previous seeds: `apps/platform/supabase/content/*.sql`
   - live: `curl -s https://techtelligence.net/blog | grep -oE 'href="/blog/[a-z0-9-]+"'`
3. Decide the audience — it drives everything:
   - **B2B** (companies buying Data & AI consultancy): credibility-first, practical, method-driven.
   - **B2C** (career switchers into IT): encouraging, honest, step-by-step.

## SEO recipe (what made batch #1 work — keep doing this)

- **Write the target Google query first**, then the title. Proven high-intent patterns:
  - B2B: cost questions ("quanto custa implementar IA"), readiness tests ("empresa pronta para IA"), method guides ("por onde começar").
  - B2C: "como migrar para TI sem experiência", role comparisons ("analista vs engenheiro vs cientista de dados"), "como conseguir primeiro emprego".
- **Title** ≤ ~60 chars with a click pattern: question + promise ("…? Um guia realista"), numbered list ("7 sinais de que…"), "guia completo do zero".
- **Slugs**: short, keyword-rich, one per locale (`slug` PT, `slug_en` EN).
- **Excerpt IS the meta description**: 140–170 chars, benefit + curiosity, both languages.
- **Body**: 700–1100 words per language. Question-phrased H2s (featured-snippet bait); scannable bullet lists; **bold** key phrases; at most one GFM comparison table (the renderer styles them); 2–3 internal links to existing posts — **verify every linked slug exists**.
- **Closing CTA section**, always last:
  - B2B → `https://techtelligence.net/consultoria` + `https://techtelligence.net/contato` (EN: `/en/consulting`, `/en/contact`)
  - B2C → `https://techtelligence.net/curso` + `https://techtelligence.net/mentoria` (EN: `/en/course`, `/en/mentorship`)
- **Tags in BOTH languages** (`tags` PT / `tags_en` EN), from the paired vocabulary: `IA`↔`AI`, `Dados`↔`Data`, `Empresas`↔`Business`, `Carreira`↔`Career`, `TI`↔`IT`, `Investimento`↔`Investment`. Same order in both arrays.

## Voice rules (non-negotiable)

- PT-BR uses "você", direct sentences, zero corporate jargon. The EN version mirrors the content and structure, not word-by-word — idiomatic English, localize examples (LGPD → "privacy laws such as LGPD and GDPR").
- Consultancy copy is credibility-first ("é exatamente isso que fazemos"); course/mentorship copy is aspirational but **non-promissory** — never promise jobs, salaries, or timelines ("não existe prazo garantido — desconfie de quem promete um").
- **Don't give away course content** (user decision 2026-07-10, after trimming the LinkedIn post): when a topic overlaps a course module, the post teaches the *what* (overview, pillars, common mistakes) but keeps the *how* (word-by-word formulas, templates, scripts, checklists, step-by-step) for the course — and says so explicitly ("o passo a passo completo é o módulo X do curso"). B2B consultancy posts can go deeper: there the method demonstrates credibility.
- Both languages are mandatory in the same seed — publishing is blocked without complete PT + EN.

## From an example

When the user provides an example post (theirs or external): extract its skeleton — section flow, H2 style, list density, length, CTA placement — and apply that skeleton to the new topic in the house voice. Never copy sentences.

## Output format

One INSERT per post in `apps/platform/supabase/content/YYYY-MM-DD-<name>.sql`, modeled on `2026-07-10-seo-posts.sql`:

- Columns: `(slug, slug_en, title, title_en, excerpt, excerpt_en, body_md, body_md_en, tags, tags_en, is_published, published_at)`.
- Dollar-quote every text field with a per-field unique tag (`$ptx1$…$ptx1$`, `$enb1$`, `$ptx2$`, …); plain-quoted strings (titles) escape `'` as `''`.
- Multiple posts: stagger `published_at` with `now() - interval 'N hours'` to control listing order — consultancy posts newest (product priority).
- Header comment: what the batch is + "run once in the Supabase SQL editor".

## Verify, then ship

1. Every dollar tag appears exactly twice: `grep -oF '$<tag>$' <file> | wc -l`.
2. Every internal `/blog/` and `/en/blog/` link resolves to a slug defined in this file, a previous seed, or the live site.
3. Commit as `content: …`, push to main (content is DB-side — nothing redeploys), then tell the user to run the SQL in the Supabase SQL editor.
4. Offer `/blog-cover` next for the cover images.
