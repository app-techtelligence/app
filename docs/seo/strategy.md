# SEO strategy — the step-by-step to 10k visits/day

**Goal:** 10.000 organic visits/day (~300k/month). **Honest timeline:** 12–24 months of consistent execution. This file is the operator's playbook — what *you* do, in order. The machinery (`/seo-strategy`, `/blog-post`, `/blog-cover`, `/seo-audit`) does the heavy lifting; the backlog lives in [content-plan.md](content-plan.md).

---

## Phase 0 — Foundations (this week, once)

1. **Google Search Console (GSC)** — the single most important tool. It shows which queries bring impressions/clicks, where you rank, and indexing problems. Without it, everything else is guesswork.
   1. Go to https://search.google.com/search-console and sign in with your Google account.
   2. "Add property" → choose the **Domain** type (left card) → enter `techtelligence.net`.
   3. Google shows a **TXT record** (`google-site-verification=...`). Copy it.
   4. Cloudflare dashboard → techtelligence.net → **DNS → Records → Add record**: Type `TXT`, Name `@`, Content = the verification string. Save.
   5. Back in GSC → **Verify** (Cloudflare DNS propagates in minutes).
   6. In GSC: **Sitemaps** → enter the **full URL** `https://techtelligence.net/sitemap.xml` → Submit (Domain properties reject relative paths like `sitemap.xml`). Status may show "couldn't fetch" for a few minutes, then becomes "Success".
   7. From now on, after publishing each post: **URL Inspection** → paste the post URL → **Request indexing** (both PT and EN URLs). On a young domain this cuts discovery from weeks to days.
   - First data appears after ~2 days. The reports that matter: **Performance** (queries, clicks, impressions, CTR, position) and **Indexing → Pages**.
2. **Bing Webmaster Tools** — https://www.bing.com/webmasters → "Import from Google Search Console" (one click, free traffic from Bing/DuckDuckGo/AI search engines).
3. **Article JSON-LD** — ask Claude to implement structured data on posts (known gap, flagged by `/seo-audit`).
4. **LinkedIn company page** ready, and the share-preview habit learned (CLAUDE.md §5.1: Post Inspector before sharing anything previously shared).

## Phase 1 — Cadence (months 1–3): publish 2–3 posts/week

The weekly loop (≈2–4h of your time; Claude does the writing):

| Day | Action | Who |
|---|---|---|
| Mon | `/seo-strategy` — pick the week's 2–3 posts from the plan | Claude |
| Mon | `/blog-post` — write them; run the SQL seed in Supabase | Claude / you (SQL) |
| Tue | `/blog-cover` — Gemini prompts → generate → drop files → upload covers | you + Claude |
| Tue | GSC **Request indexing** for each new URL (PT + EN) | you |
| Wed | Share each post on LinkedIn (profile + company page) | you |
| any | Add 1 link from an older post to each new post (admin editor or ask Claude for an UPDATE seed) | you / Claude |

Rules that compound: deepen one cluster before opening another; never break the cadence for perfection — a good post this week beats a perfect post next month.

## Phase 2 — Authority (months 3–6): links + data-driven doubling down

By now GSC has real data. Add the monthly loop:

1. **`/seo-audit`** — technical regression check.
2. **GSC review with Claude**: export the Performance queries and paste/screenshot them; then:
   - posts with impressions but **CTR < 1%** → rewrite title/excerpt (packaging problem);
   - posts ranking **positions 5–15** → expand/deepen them (almost-winners are the cheapest wins);
   - queries you rank for **without a dedicated post** → new post idea into the plan.
3. **Backlinks — 2–4 real links/month.** In order of effort/return for this niche:
   - Publish LinkedIn *articles* (not just posts) summarizing a blog post, linking home.
   - PT-BR communities: TabNews, dev.to, Medium — republish summaries with canonical link home.
   - Guest posts on Brazilian tech/business blogs (offer the AI-cost and readiness angles — they travel well).
   - Partners/clients/tools you use: directory listings, "empresas que usam X" pages, event speaker bios.
4. **Distribution beyond LinkedIn**: relevant WhatsApp/Telegram communities (share when genuinely useful, never spam).

## Phase 3 — Scale (months 6–24): from hundreds to thousands/day

- **Expand winning clusters programmatically**: e.g. "quanto ganha um X" for every data/IT role; "IA para [setor]" for every industry — each a real post, template accelerated via `/blog-post`.
- **Link magnets**: one interactive asset earns more links than 20 posts — a salary explorer, an "IA readiness" self-assessment, a data-career roadmap PDF. Build when cadence is stable.
- **EN market**: the bilingual mirror starts pulling international long-tail; check GSC's country report and invest if it's growing.
- **Refresh economy**: every post > 6 months old gets reviewed (update numbers, add sections, bump `updated_at`) — refreshes often outperform new posts.

## Milestones (honest ranges — measure monthly, judge quarterly)

| When | Expected organic traffic | If below, check |
|---|---|---|
| Month 1–2 | ~0–10/day (indexing lag is normal) | GSC coverage: are pages indexed? |
| Month 3 | 30–100/day | Cadence held? Titles/CTR? |
| Month 6 | 200–800/day | Backlinks started? Cluster depth? |
| Month 12 | 1.5k–4k/day | Doubling down on GSC winners? |
| Month 18–24 | **10k/day** | Scale levers (programmatic, magnets, EN) |

## Who does what

| Claude (skills/agents) | You |
|---|---|
| Pick topics, validate SERPs, write posts, covers pipeline, audits, JSON-LD and code fixes, UPDATE seeds | Run SQL in Supabase, upload covers, GSC/Bing setup + request indexing, share/distribute, build relationships for backlinks, paste GSC data monthly |

**The one metric that predicts everything in phase 1: posts published per week.** Protect the cadence.
