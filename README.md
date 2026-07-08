# TechTelligence — Website

Marketing site for TechTelligence: **Curso** (career-transition course), **Mentoria** (1:1 mentorship) and **Consultoria** (Data & AI services for companies). v1 is a fully static, bilingual informational site — no login, no payments. See [CLAUDE.md](CLAUDE.md) for the full project brief.

## Stack

Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 · next-intl v4 (pt-BR at root, en under `/en`) · Turborepo + pnpm · Cloudflare Workers via `@opennextjs/cloudflare` · Zod · Cloudflare Turnstile · Resend.

## Getting started

```bash
pnpm install
pnpm dev            # next dev on http://localhost:3000
pnpm build          # static build (also regenerates public/_headers)
pnpm --filter web preview   # full Workers-runtime simulation (wrangler)
pnpm --filter web deploy    # build + deploy to Cloudflare Workers
```

Copy `apps/web/.dev.vars.example` to `apps/web/.dev.vars` for local secrets (the checked-in example uses Cloudflare's always-pass Turnstile test key; leave `RESEND_API_KEY` empty to stub email delivery locally).

## Environment & secrets

| Name | Where | Purpose |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | `.dev.vars` locally · `wrangler secret put` in prod | Server-side Turnstile verification |
| `RESEND_API_KEY` | `.dev.vars` locally · `wrangler secret put` in prod | Contact-form email delivery |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | build-time env (falls back to test key) | Turnstile widget on the contact form |
| `NEXT_PUBLIC_SITE_URL` | build-time env (falls back to `https://techtelligence.com.br`) | Canonical/OG/sitemap URLs |

Never commit secrets. Only `NEXT_PUBLIC_*` values reach the client.

## i18n rules

- Every UI string lives in `apps/web/messages/pt-BR.json` **and** `en.json` — both updated in the same commit, identical key structure. Never hardcode user-facing text.
- Routes are defined once in `apps/web/i18n/routing.ts` (localized pathnames). Add new pages there + both message files + `app/[locale]/<page>/`.

## Security model (v1)

- **Headers come from two places by design** — don't remove either: `next.config.ts headers()` covers worker-rendered responses; the generated `public/_headers` (source: `apps/web/lib/security-headers.mjs`, emitted by the `prebuild` script) covers asset-served responses (prerendered `/en/*` pages, `/_next/static/*`), which bypass the worker on Cloudflare.
- Contact form: Zod validation → Turnstile `siteverify` → Resend delivery. Submissions are **not stored**; PII is never logged.
- Keep `middleware.ts` on the legacy filename — the OpenNext Cloudflare adapter does not support Next 16's `proxy.ts`.

## Build notes (don't "simplify" these away)

- `nodeLinker: hoisted` in `pnpm-workspace.yaml`: pnpm's default symlinked layout breaks the OpenNext bundler (500s from unresolvable manifest/chunk requires — workers-sdk#10236).
- `next build --webpack` in `apps/web`: Turbopack server chunks fail to load through the adapter's runtime patching. Re-test `pnpm --filter web preview` before switching back to Turbopack.

## Manual Cloudflare/ops checklist (one-time, dashboard)

1. **Turnstile**: create a widget for the production domain; set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (build var) and `wrangler secret put TURNSTILE_SECRET_KEY`.
2. **Resend**: verify the sending domain (DNS records); `wrangler secret put RESEND_API_KEY`; update `emailFrom` in `apps/web/lib/site-config.ts` if the domain differs.
3. **CI/CD**: connect the GitHub repo to Cloudflare **Workers Builds** (build command `pnpm --filter web deploy`, or use upload + preview URLs per branch).
4. **WAF**: add a rate-limiting rule on `POST /api/contact` (e.g. 5 requests/min per IP).
5. **Domain**: add the custom domain to the Worker; confirm DNS is on Cloudflare.

## Pending content (placeholders in code)

- Official **SVG logo** — `components/brand/LogoMark.tsx` is a vector approximation; `Logo.png` is the original raster.
- **WhatsApp number + contact email** — single swap point: `apps/web/lib/site-config.ts`.
- **Founder bio + photo** (About page), **course curriculum details** (Course page), **consultancy proof points** (Consulting page) — sections are written with clearly-labeled generic/example copy.
- **Domain name** — update `NEXT_PUBLIC_SITE_URL` / `site-config.ts` once final.
