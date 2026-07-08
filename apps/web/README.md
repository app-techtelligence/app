# @techtelligence/web

The Next.js marketing site. See the [root README](../../README.md) for setup, secrets and the ops checklist, and [CLAUDE.md](../../CLAUDE.md) for the project brief.

```bash
pnpm dev        # local dev (Node runtime + .dev.vars via initOpenNextCloudflareForDev)
pnpm build      # prebuild regenerates public/_headers, then next build
pnpm preview    # OpenNext build + wrangler dev (real Workers runtime)
pnpm deploy     # OpenNext build + wrangler deploy
pnpm cf-typegen # regenerate cloudflare-env.d.ts after wrangler.jsonc changes
```

Utility scripts: `node scripts/generate-brand-assets.mjs` regenerates the OG image and apple-touch icon.
