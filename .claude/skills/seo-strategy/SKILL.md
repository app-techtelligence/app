---
name: seo-strategy
description: Plan what to publish next to grow techtelligence.net toward the 10k-visits/day goal — keyword clusters, SERP research, prioritized backlog in docs/seo/content-plan.md. Use when the user asks what to write next, for keyword research, a content calendar, or how traffic is tracking against the goal.
---

# SEO strategy — the road to 10k visits/day

The goal (set 2026-07-10): **10,000 organic visits/day ≈ 300k/month**. For a young domain that realistically means **100–300 posts ranking across clusters plus domain authority**, built over 12–24 months. Content velocity is the biggest lever this skill controls; every run should end with the next posts chosen and justified.

## The math to keep in mind

- A post ranking #1–3 for a mid-tail PT query typically brings 10–100 visits/day; long-tail posts bring 1–10/day each but win faster.
- 10k/day ≈ a portfolio like: ~10 head-term winners (100+/day) + ~50 mid-tail (20–50/day) + ~150 long-tail (5–15/day). Plan clusters, not one-off posts.
- New-domain reality: expect months of near-zero, then compounding. Don't judge posts before ~90 days in the index.

## Each run, in order

1. **Inventory**: read `docs/seo/content-plan.md` (the living plan) and cross-check what's live: `curl -s https://techtelligence.net/sitemap.xml | grep -oE "<loc>[^<]+"`. Update statuses (idea → live) before planning anything new.
2. **Pick the working cluster**: deepen an existing cluster before opening a new one — Google rewards topical depth, and internal links inside a cluster lift every post in it.
3. **Validate demand and competition** before committing a post: spawn the `seo-researcher` agent (or use WebSearch directly) on the target query. Green lights: forums/thin listicles ranking, no strong PT-BR answer, question appears in "related searches". Red lights: SERP owned by giants (Alura, Rocketseat, big banks) with deep content — then go longer-tail.
4. **Score candidates** (1–5 each, sum): product fit (does it feed consultoria/curso/mentoria?), intent (commercial > informational), winnability (weak SERP = 5), cluster leverage (how many existing posts can link to/from it).
5. **Update the plan file** and end with **the top 3 next posts** — each with target query, working title, cluster, and the internal links it should give/receive. Hand them to `/blog-post`.

## Standing rules

- PT-BR queries are the primary battlefield (less competition, higher intent for a Brazilian business); EN versions come free via the bilingual rule.
- Respect the editorial rule: career posts tease the method, the course teaches it; B2B posts can go deep (depth = credibility = consultancy leads).
- Cadence target: **2–3 posts/week sustained** beats 10 posts one week and silence after.
- Every new post links to 2–3 older posts AND gets a link added from at least one older post (ask the user to update old posts via admin, or produce an UPDATE seed).

## The levers this skill does NOT control (remind the user when relevant)

- **Google Search Console** — must be set up (verify domain, submit sitemap.xml). Without it we're flying blind on queries/impressions/CTR. Once set up, its query data replaces guesswork in step 3.
- **Backlinks/authority** — guest posts, PT-BR dev/data communities (Tabnews, dev.to, LinkedIn articles pointing home), directories, partner mentions.
- **Distribution** — every post shared on LinkedIn (founder profile + company page), relevant communities; run URLs through the share-preview tools first (CLAUDE.md §5.1).
- **Measurement cadence** — monthly: GSC clicks/impressions per cluster; kill/rewrite posts with impressions but CTR < 1% (title/excerpt problem), expand posts ranking 5–15 (almost there).
