# TechTelligence

Monorepo for TechTelligence: **Curso** (career-transition course), **Mentoria** (1:1 mentorship) and **Consultoria** (Data & AI services for companies). See [CLAUDE.md](CLAUDE.md) for the full project brief and conventions.

Two apps, both live on Cloudflare Workers:

| App | Worker | URL | What it is |
|---|---|---|---|
| [`apps/web`](apps/web) | `app` | https://techtelligence.net (+ www) | Bilingual static marketing site — no login, no payments |
| [`apps/platform`](apps/platform) | `platform` | https://plataforma.techtelligence.net | Course platform — Supabase auth, protected R2 video, admin editor ([README](apps/platform/README.md)) |

## Stack

Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 · next-intl v4 (pt-BR at root, en under `/en`) · Turborepo + pnpm · Cloudflare Workers via `@opennextjs/cloudflare` · Supabase (Postgres + Auth, RLS) · Cloudflare R2 · Zod · Cloudflare Turnstile · Resend.

## Getting started

```bash
pnpm install
pnpm dev                         # both apps: web on :3000, platform on :3001
pnpm build                       # static/webpack builds (web also regenerates public/_headers)
pnpm test                        # vitest unit tests (also run in CI with lint + typecheck)
pnpm --filter web preview        # full Workers-runtime simulation (wrangler)
pnpm --filter web deploy         # build + deploy to Cloudflare Workers
pnpm --filter platform deploy
```

Local env:
- **web**: copy `apps/web/.dev.vars.example` → `.dev.vars` (checked-in example uses Cloudflare's always-pass Turnstile test key; leave `RESEND_API_KEY` empty to stub email delivery locally).
- **platform**: copy `apps/platform/.env.local.example` → `.env.local` (Supabase URL + anon key — see the [platform README](apps/platform/README.md) for first-time Supabase/R2 setup).

## Environment & secrets

| Name | App | Where | Purpose |
|---|---|---|---|
| `TURNSTILE_SECRET_KEY` | web | `.dev.vars` locally · `wrangler secret put` in prod | Server-side Turnstile verification |
| `RESEND_API_KEY` | web | `.dev.vars` locally · `wrangler secret put` in prod | Contact-form email delivery |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | web | build-time env (falls back to test key) | Turnstile widget on the contact form |
| `NEXT_PUBLIC_SITE_URL` | web | build-time env (falls back to `https://techtelligence.net`) | Canonical/OG/sitemap URLs |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | platform | `.env.local` / build-time env | Supabase client (public values; RLS is the barrier) |

Never commit secrets. Only `NEXT_PUBLIC_*` values reach the client; the Supabase `service_role` key must never appear anywhere in this repo.

## i18n rules

- Every UI string lives in each app's `messages/pt-BR.json` **and** `en.json` — both updated in the same commit, identical key structure (enforced by `apps/web/messages/messages.test.ts` in CI). Never hardcode user-facing text.
- Routes are defined once per app in `i18n/routing.ts` (localized pathnames). Add new pages there + both message files + `app/[locale]/<page>/`.
- Platform DB content is additionally bilingual via `*_en` columns picked by `lib/content.ts` (falls back to PT).

## Security model

- **Headers come from two places by design** — don't remove either: `next.config.ts headers()` covers worker-rendered responses; web's generated `public/_headers` (source: `lib/security-headers.mjs`, emitted by the `prebuild` script) covers asset-served responses (prerendered `/en/*` pages, `/_next/static/*`), which bypass the worker on Cloudflare. Platform is fully dynamic and only needs `next.config.ts`.
- Contact form: Zod validation → Turnstile `siteverify` → Resend delivery. Submissions are **not stored**; PII is never logged.
- Platform: RLS default-deny on every table; admin enforced by RLS + server checks + middleware; role promotion is SQL-only; course video served only through an auth/entitlement-gated route. Details in [CLAUDE.md §9](CLAUDE.md).
- Keep `middleware.ts` on the legacy filename — the OpenNext Cloudflare adapter does not support Next 16's `proxy.ts`.

## Build notes (don't "simplify" these away)

- `nodeLinker: hoisted` in `pnpm-workspace.yaml`: pnpm's default symlinked layout breaks the OpenNext bundler (500s from unresolvable manifest/chunk requires — workers-sdk#10236).
- `next build --webpack` in both apps: Turbopack server chunks fail to load through the adapter's runtime patching. Re-test `pnpm --filter <app> preview` before switching back to Turbopack.

## Ops state

Done: domain `techtelligence.net` on Cloudflare Registrar with custom-domain routes on both workers · production Turnstile widget · Resend domain verified (sender `noreply@techtelligence.net`) · Supabase custom SMTP + branded bilingual confirmation email · Email Routing `contato@` → inbox · GitHub Actions CI (lint + typecheck + test).

Remaining:
1. **CI/CD deploys**: connect the repo to Cloudflare **Workers Builds** (CI currently tests but doesn't deploy).
2. **WAF**: confirm a rate-limiting rule on `POST /api/contact` (e.g. 5 requests/min per IP).
3. Optional: `techtelligence.com.br` alias domain.

## Pending content (placeholders in code)

- **Founder bio + photo** (About page) and **real course curriculum** — sections carry clearly-labeled generic copy; the platform is seeded with a single course/module/lesson. (Consultancy proof points are done: team-experience logo wall in `components/sections/shared/ClientLogos.tsx` + `lib/clients.ts`.)
- **Payments** (Stripe + Mercado Pago/Pix) replace the platform's beta self-enrollment when the course is ready to sell.

Logo and contact details are real. Brand sources live at the repo root (`Logo.svg`, `Logo.png`); web assets derive from them via `node scripts/generate-brand-assets.mjs`. Contact info's single source of truth is `apps/web/lib/site-config.ts`.
