# CLAUDE.md — TechTelligence

Project brief and working conventions for Claude Code. Read this before starting any task.

## 1. What this project is

TechTelligence is a Brazilian company with three products, sold through one website:

1. **Curso (Course)** — career-transition course for people migrating into IT with no prior experience (Dev, Front-end, Back-end, DevOps, Data Engineer, Data Analyst, Data Scientist, and other roles). Audience: individuals. B2C.
2. **Mentoria (Mentorship)** — 1:1 help to land a job or grow in IT: career strategy, LinkedIn optimization, interview prep, skill development. Audience: individuals. B2C.
3. **Consultoria (Consultancy)** — Data & AI services for companies: implementing data platforms, AI environments, or both. Audience: businesses. B2B.

Brand narrative that ties everything together: "We build Data & AI solutions for companies, so we know exactly what the market hires for — and we train people to get there." Use this credibility loop on the Home and About pages.

## 2. Current phase and roadmap

**v1 (NOW): informational website.** No login, no payments, no user accounts. Every page informs, sells, and drives contact — WhatsApp as primary CTA, contact form as secondary.

**v2 (LATER): platform.** Student login, course video hosting, mentorship booking, payments (Pix is essential in Brazil). The architecture below is already shaped for v2, but **do not build v2 features unless explicitly asked.**

## 3. Brand

- **Name:** TechTelligence — wordmark renders "TECH" in navy and "TELLIGENCE" in gray-blue.
- **Logo:** a mountain/peak formed by triangles. Metaphor: climbing, growth, reaching the top. Echo the triangle geometry subtly in the design (section dividers, icons, background patterns). Ask the user for an SVG/vector version; a JPG exists at low fidelity.
- **Colors:**
  - Navy (primary): `#1A2A44` — headings, body text, hero/footer backgrounds
  - Gray-blue (secondary): `#727B8A` — subtitles, muted text, borders
  - Backgrounds: `#FFFFFF` and off-white `#F7F8FA`
  - Accent (CTAs/buttons): **TBD with the user** — propose options (bright cyan vs. amber) tested against navy. Buttons must always contrast strongly with their background.
- **Typography:** modern geometric sans-serif via `next/font` (propose Inter or Manrope). Generous letter-spacing on headings, echoing the wordmark.
- **Tone of voice:** professional but encouraging. PT-BR uses "você", direct sentences, no corporate jargon. Course/Mentorship pages are aspirational ("sua transição para a área tech começa aqui"); the Consultancy page is credibility-first and results-oriented.

## 4. Site map (v1)

| Route (PT) | Route (EN) | Page | Goal |
|---|---|---|---|
| `/` | `/en` | Home | Router page: brand promise + three equally-weighted "doors" (Curso, Mentoria, Consultoria) |
| `/curso` | `/en/course` | Course | Sell the transformation; who it's for; curriculum overview; CTA: join waitlist / WhatsApp |
| `/mentoria` | `/en/mentorship` | Mentorship | Types of help; how it works (formats, steps); CTA: WhatsApp |
| `/consultoria` | `/en/consulting` | Consultancy | B2B: services (data platforms, AI environments), approach, credibility; CTA: request a proposal |
| `/sobre` | `/en/about` | About | Founder story — the credibility engine for all three products |
| `/contato` | `/en/contact` | Contact | WhatsApp primary + Turnstile-protected form |
| `/privacidade` | `/en/privacy` | Privacy | LGPD requirement |

WhatsApp is the primary CTA across all product pages (Brazilian audience expectation). A floating WhatsApp button is acceptable if it doesn't hurt aesthetics.

## 5. Internationalization (i18n)

- Locales: `pt-BR` (default) and `en`.
- Library: `next-intl` with locale routing and localized pathnames. `localePrefix: "as-needed"` → Portuguese lives at the root (`/curso`), English under `/en` (`/en/course`).
- First visit: detect browser language and route accordingly; persist the user's explicit choice in a cookie. Language toggle (PT | EN) always visible in the header.
- **Every** UI string lives in `messages/pt-BR.json` and `messages/en.json`. Never hardcode user-facing text in components. When adding any string, add both languages in the same commit.
- SEO: per-locale metadata, `hreflang` alternates, localized OG tags, sitemap covering both locales.

## 6. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript (strict) | One framework for the site now and the platform later |
| Styling | Tailwind CSS | Brand colors defined as design tokens in the Tailwind config |
| Monorepo | Turborepo + pnpm workspaces | `apps/web` now; `apps/platform` in v2; shared packages as needed |
| Hosting | **Cloudflare Workers** via `@opennextjs/cloudflare` | Deploy with `wrangler`; enable `nodejs_compat` compatibility flag |
| CI/CD | GitHub repo → Cloudflare Workers Builds | Preview deployment per branch/PR |
| DNS / CDN / WAF | Cloudflare | Edge caching, rate limiting, bot protection, DDoS included |
| Database + Auth (v2) | Supabase (Postgres + Supabase Auth) | Row Level Security mandatory on every table |
| File storage (v2) | Cloudflare R2 | S3-compatible, zero egress fees |
| Course video (v2) | Cloudflare Stream | Signed, expiring playback URLs only |
| Anti-spam | Cloudflare Turnstile | On the contact form (and all future public forms) |
| Transactional email | Resend | Contact-form notifications now; auth/receipt emails in v2 |
| Validation | Zod | Every external input (forms, API routes, webhooks, env vars) |
| Payments (v2) | Stripe + Mercado Pago | Mercado Pago covers **Pix** — essential for Brazil |

**Cloudflare caveat:** the Workers runtime is not Node.js. Before using any Next.js feature (ISR, image optimization, etc.), confirm it is supported by the OpenNext Cloudflare adapter. Prefer static generation for all marketing pages anyway — they should be fully static and cached at the edge.

## 7. Repo structure

```
techtelligence/
├── CLAUDE.md                  # this file
├── turbo.json
├── pnpm-workspace.yaml
├── apps/
│   └── web/                   # Next.js marketing site (v1)
│       ├── app/               # App Router pages
│       ├── components/
│       ├── messages/          # pt-BR.json, en.json
│       ├── public/            # logo, favicons, OG images
│       └── wrangler.jsonc     # Cloudflare Workers config
└── packages/                  # created when first shared code appears (v2)
    ├── ui/                    # shared components (future)
    └── config/                # shared tsconfig/eslint (future)
```

## 8. Security requirements

### v1 (informational site)
- Attack surface is minimal — keep it that way. No user data is stored except contact-form submissions.
- Contact form: validate server-side with Zod, protect with Turnstile, rate-limit the endpoint (Cloudflare WAF rule), deliver via Resend. Do not store submissions in v1.
- Security headers on every response: CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`.
- Secrets: never committed. Local dev uses `.dev.vars` / `.env.local` (gitignored). Production secrets via `wrangler secret` or the Cloudflare dashboard. Only `NEXT_PUBLIC_*` variables may reach the client — and they must never contain secrets.
- Dependencies: keep lockfile committed; run `pnpm audit` before releases; enable Dependabot/Renovate.

### v2 (platform — for future reference)
- **Authentication:** Supabase Auth only — never hand-rolled. Email+password with mandatory email verification, OAuth via Google and GitHub (fits the IT audience), optional MFA. Sessions in secure httpOnly cookies via `@supabase/ssr`. Supabase's built-in rate limiting on auth endpoints.
- **Authorization:** roles `visitor → student → mentor → admin`. Enforced twice: Postgres **Row Level Security** on every table (default deny), plus server-side checks in route handlers. Never trust the client for role or ID.
- **Payments:** card data never touches our servers — Stripe / Mercado Pago hosted flows only. Verify webhook signatures. Grant course access only after a verified payment event.
- **Course content protection:** Cloudflare Stream signed URLs with short expiry, generated server-side for authenticated, entitled users only.
- **LGPD compliance:** explicit consent at collection points, collect the minimum, privacy policy page, support data export and deletion on request, define retention periods.
- Never log PII, tokens, or secrets.

## 9. Conventions

- TypeScript `strict: true`; no `any`.
- Server Components by default; Client Components only when interactivity requires it.
- Mobile-first: most Brazilian traffic is mobile. Design and test at 375px first.
- Accessibility: semantic HTML, alt text on all images, visible focus states, WCAG AA contrast (navy `#1A2A44` on white passes).
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Small PRs/commits, one concern each.
- Performance budget: marketing pages fully static, Lighthouse ≥ 90 on mobile.

## 10. Open questions (ask the user before assuming)

1. Accent color for CTAs — cyan vs. amber (present visual options).
2. Vector (SVG) version of the logo.
3. WhatsApp number and business email for CTAs.
4. Domain name and whether DNS is already on Cloudflare.
5. Founder bio + photo for the About page.
6. Course details (name, format, curriculum) — pending a dedicated working session.
7. Consultancy proof points: past projects, technologies, any client names usable publicly.
