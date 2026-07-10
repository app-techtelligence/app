# TechTelligence — Plataforma

Course platform, live at https://plataforma.techtelligence.net (Cloudflare Worker `platform`). Supabase auth + RLS, protected video streaming from R2, bilingual content, and an admin course editor. See the repo-root [CLAUDE.md](../../CLAUDE.md) for the full brief.

## Getting started

```bash
pnpm install                       # from the repo root
cp .env.local.example .env.local   # fill in Supabase URL + anon key
pnpm --filter platform dev         # next dev on http://localhost:3001
pnpm --filter platform preview     # full Workers-runtime simulation
pnpm --filter platform deploy      # build + deploy
```

`.env.local` holds only **public** values (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — RLS is the security barrier. The `service_role` key must never appear in this repo.

### First-time backend setup

1. **Supabase**: paste [`supabase/setup-all.sql`](supabase/setup-all.sql) into the SQL editor (it concatenates migrations `0001`–`0004`: schema + seed + bilingual columns + admin policies). Promote your account with the commented statement at the end.
2. **Email**: enable custom SMTP (Resend) and set the "Confirm signup" template to [`supabase/email-templates/confirm-signup.html`](supabase/email-templates/confirm-signup.html) — it's locale-aware via `user_metadata.locale`.
3. **R2**: the `MEDIA` binding in [`wrangler.jsonc`](wrangler.jsonc) points at bucket `techtelligence-media`. Upload lesson videos through the admin UI (`/admin`).

When adding a migration, append it to `setup-all.sql` too.

## How it works

- **Auth**: signup (`/criar-conta`) records `full_name` and the locale from the server URL in `user_metadata`; email confirmation is mandatory; login lands on `/painel`. `middleware.ts` refreshes the session cookie and redirects unauthenticated users to login (keep the legacy `middleware.ts` filename — OpenNext doesn't support Next 16's `proxy.ts`).
- **Roles**: `profiles.role` ∈ `student|mentor|admin`, default `student`. Promotion is SQL-only by design — no UI. Admin is enforced in three layers: RLS (`is_admin()` policies), `getAdminContext()` in every admin page/action/route, and middleware.
- **Enrollment**: beta self-enroll into published + `beta_open` courses (RLS-gated). Payments replace this later.
- **Video playback**: `<video>` points at `/api/media/[lessonId]`, which checks auth + entitlement (enrolled, free-preview, or admin) and streams from R2 with HTTP Range support (`206`), `Cache-Control: private, no-store`.
- **Video upload**: admin-only R2 multipart flow (`/api/admin/upload`) — 32 MiB chunks from the browser, key validated against the lesson, replaced objects deleted on completion.
- **Bilingual content**: UI strings in `messages/pt-BR.json` + `en.json` (next-intl, PT at root, EN under `/en`); DB content via `title_en`/`description_en` columns picked by `lib/content.ts` with PT fallback.
- The whole app is `noindex,nofollow`.

## Build notes

Shared with the rest of the monorepo (see root README): `nodeLinker: hoisted` and `next build --webpack` are required for the OpenNext Cloudflare adapter — re-test `preview` before changing either.
