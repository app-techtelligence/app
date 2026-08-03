# @techtelligence/web

The Next.js marketing site. See the [root README](../../README.md) for setup, secrets and the ops checklist, and [CLAUDE.md](../../CLAUDE.md) for the project brief.

```bash
pnpm dev        # local dev (Node runtime + .dev.vars via initOpenNextCloudflareForDev)
pnpm build      # prebuild regenerates public/_headers, then next build
pnpm preview    # OpenNext build + wrangler dev (real Workers runtime)
pnpm deploy     # OpenNext build + wrangler deploy
pnpm cf-typegen # regenerate cloudflare-env.d.ts after wrangler.jsonc changes
```

## Environment variables

Copy `.dev.vars.example` to `.dev.vars` for local development. Production values are set with `wrangler secret put`.

- `RESEND_API_KEY` — Resend email API key (https://resend.com/api-keys). Leave empty to stub email sending locally.
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile secret for the contact form. Use the test key `1x0000000000000000000000000000000AA` locally (https://developers.cloudflare.com/turnstile/troubleshooting/testing/).
- `ANTHROPIC_API_KEY` — Anthropic API key for the chat assistant (https://console.anthropic.com/). Leave empty to stub chat responses locally (.dev.vars). In production, set with `wrangler secret put ANTHROPIC_API_KEY`.
- `CHAT_SESSION_SECRET` — HMAC secret for signing chat session tokens. Generate with `openssl rand -base64 32`. Used both locally (.dev.vars) and in production (wrangler secret).

Utility scripts:
- `node scripts/generate-brand-assets.mjs` regenerates the OG image and apple-touch icon.
- After editing the assistant knowledge base in `content/assistant/`, run `pnpm --filter web generate:knowledge` to regenerate `lib/chat/knowledge.generated.ts` (the sync test fails otherwise).
