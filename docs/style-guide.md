# TechTelligence UI Style Guide

The single reference for building any new page or component in this repo.
CLAUDE.md §3 (brand) and §12 (conventions) are the policy; this file is the
implementation detail. The blog-cover art direction is a separate, distinct
style — see `.claude/skills/blog-cover/SKILL.md`; don't mix the two.

Tokens are duplicated (deliberately, see CLAUDE.md §13.5) in
`apps/web/app/globals.css` and `apps/platform/app/globals.css` as Tailwind v4
`@theme` blocks. **Change them together.**

## 1. Design tokens

| Token | Value | Use for |
|---|---|---|
| `navy` | `#1A2A44` | Headings, body text, dark backgrounds, secondary buttons |
| `navy-deep` | `#111B2E` | Hover on navy, bottom of navy gradients |
| `steel` | `#667080` | Muted text on white/canvas (AA) |
| `steel-light` | `#9AA3B0` | Muted text on navy (AA) |
| `canvas` | `#F7F8FA` | Off-white backgrounds |
| `accent` | `#F59E0B` | Amber CTA **backgrounds**; amber text only on dark |
| `accent-strong` | `#D97706` | CTA hover, focus outline |
| `accent-ink` | `#B45309` | Amber **text** on white/canvas (AA-safe) |

Rules that keep us honest:

- CLAUDE.md quotes the brand gray-blue as `#727B8A`, but that hex fails WCAG
  AA as text on white — the implemented values are `steel`/`steel-light`.
  Never (re)introduce `#727B8A` in code.
- **Never `text-accent` on white or canvas** — use `text-accent-ink`. On navy
  or dark gradients, `text-accent` is correct (SectionHeading's `onDark` prop
  encodes this switch).
- Intentional per-app difference: web `body` background is `#fff`; platform
  `body` background is `canvas`. Don't "sync" it away.
- Semantic red (danger, negative status) is Tailwind's default palette:
  tinted `bg-red-600/10` backgrounds with `text-red-700` text. Don't add a
  red token; don't use red for anything except destructive/negative meaning.

## 2. Typography

Manrope via `next/font/google` (`subsets: ["latin", "latin-ext"]`, variable
`--font-manrope`, `display: "swap"`), wired to `--font-sans`. Headings are
extrabold with generous letter-spacing:

| Element | Classes |
|---|---|
| Hero h1 (web) | `text-4xl font-extrabold leading-tight tracking-wide sm:text-5xl` |
| Page h1 (platform) | `text-3xl font-extrabold tracking-wide text-navy` |
| Section h2 | `text-3xl font-extrabold tracking-wide sm:text-4xl` |
| Kicker / eyebrow | `text-xs font-bold uppercase tracking-[0.22em]` + `text-accent` (dark bg) / `text-accent-ink` (light bg) |
| Small section label (platform) | `text-sm font-extrabold uppercase tracking-[0.2em] text-navy`, preceded by `<TriangleBullet className="h-3 w-3 text-accent" />` |
| Subtitle / lead | `text-steel` (platform) / `text-white/75` (on navy) |
| Body small | `text-sm leading-relaxed text-steel` |
| Wordmark | `font-extrabold uppercase tracking-[0.14em]`, "Tech" navy + "telligence" steel |

## 3. Layout

- Containers: both apps `mx-auto w-full max-w-[85rem] px-4 sm:px-6 lg:px-8`
  (`components/ui/Container.tsx` in each app — same width by design). Narrow
  platform pages pass `max-w-4xl`.
- Vertical rhythm: web sections `py-16 sm:py-20`, heroes `py-20 sm:py-28`;
  platform pages `py-12 sm:py-16`. Inside a block, space with `mt-*` /
  `space-y-*`.
- Dark bands: `bg-gradient-to-b from-navy to-navy-deep`, optionally with the
  `LogoMark` as a huge watermark (`text-white/[0.04]`, `hidden md:block`).
  Light bands alternate `bg-white` and `bg-canvas`.
- Mobile-first; always check 375px. Wide content (kanban boards, tables)
  scrolls inside its own `overflow-x-auto` container — the page never
  scrolls horizontally.

## 4. Component idioms

Primitives live per app (`components/ui`, `components/brand`); platform does
NOT import from web. Reuse these before inventing new ones:

- **Buttons** — `Button` / `buttonVariants(variant, size, extra)`; variants
  `primary` (amber bg + **navy** text), `secondary` (navy bg + white text),
  `outline`, `onDark`; sizes `md` (`h-11 px-5 text-sm`) and `lg`
  (`h-12 px-7 text-base`). Links that look like buttons use
  `className={buttonVariants(...)}`. In dense UI (cards), a compact one-off
  is acceptable: `rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-navy`.
- **Card** — `rounded-xl border border-navy/10 bg-white p-7 shadow-sm`
  (list rows `p-4 sm:p-5` + `transition-all hover:-translate-y-0.5
  hover:border-accent/60 hover:shadow-md`). Disabled/locked variant:
  `border-dashed border-navy/15 bg-white/60`.
- **Empty state** — `rounded-xl border border-navy/10 bg-white p-8
  text-center text-steel`.
- **Callout / notice** — `rounded-md bg-accent/10 px-4 py-3 text-sm
  font-medium text-accent-ink`.
- **Chip / count badge** — `rounded-full bg-navy/5 px-3 py-1 text-xs
  font-bold text-steel`; tag label `text-xs font-bold uppercase
  tracking-[0.18em] text-accent-ink`. Status chips: waiting/attention =
  `bg-accent/15 text-amber-800` (small bold text on the amber tints needs
  4.5:1 — `accent-ink` falls just short there); negative = `bg-red-600/10
  text-red-700`.
- **Form fields** — label `mb-1 block text-xs font-bold text-navy`; input
  `w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-sm
  text-navy focus:border-navy`; checkbox `h-4 w-4 accent-navy`.
- **Save-in-place forms (platform)** — wrap in `SaveForm`
  (`components/admin/SaveForm.tsx`) for the "Salvando… / ✓" snackbar; pass
  pre-translated `savingLabel`/`savedLabel`. Redirecting actions are NOT
  wrapped (the navigation is the feedback). Create-new forms sit **above**
  the lists they feed.
- **Icons** — inline SVG in `components/ui/icons.tsx`, `currentColor`,
  `aria-hidden="true"`, `{className}` prop. Add new icons there, same style.
- **Triangle motif** — `TriangleBullet` before section labels,
  `TriangleDivider` between web sections, `LogoMark` watermark in heroes.
  Echo the peak geometry; don't invent new decorative languages.

## 5. Accessibility

- Global `:focus-visible` amber outline comes from globals.css — never
  suppress outlines.
- Semantic HTML first (`section`, `ol/li`, `article`, real `button`s);
  landmarks get `aria-label`; active nav gets `aria-current`; menus get
  `aria-haspopup`/`aria-expanded`; async feedback gets `role="status"`.
- Decorative SVGs/characters get `aria-hidden="true"`. Icon-only buttons get
  `aria-label` (and usually `title`).
- Contrast is AA everywhere — that's what `steel`/`accent-ink` exist for.

## 6. i18n

- Every UI string in `messages/pt-BR.json` AND `messages/en.json`, same
  commit — the message-parity vitest in each app fails on drift.
- Namespaces are top-level per page/feature (`dashboard`, `jobTracker`…);
  header strings live under `common`. Keys are flat camelCase.
- Platform's layout ships only `messages.common` to Client Components — a
  client component outside `common` gets its strings as props from its
  server parent (see the job-tracker board's `labels` object).
- Navigation only via `@/i18n/navigation` helpers; new routes are registered
  in `i18n/routing.ts` pathnames, keyed by the **internal EN-style path**,
  which must match the `app/[locale]/<dir>` directory name.
- PT-BR uses "você", direct sentences, no corporate jargon (CLAUDE.md §3).

## 7. New platform page checklist

1. Add the pathname pair to `apps/platform/i18n/routing.ts` (internal key =
   directory name).
2. `app/[locale]/<internal-key>/page.tsx`: async Server Component; await
   `params`; `setRequestLocale(locale)`; `getTranslations("<ns>")`;
   `createClient()` + `supabase.auth.getUser()` + `redirect({ href:
   "/login", locale })` guard (middleware already protects non-public paths —
   this is defense in depth).
3. Render inside `<Container className="py-12 sm:py-16">`, h1 + subtitle per
   §2, cards per §4.
4. Strings in both message files (+ keep the parity test green).
5. Mutations: `"use server"` actions validating with Zod v4
   (`z.uuid()`, `safeParse(Object.fromEntries(formData))`), auth re-check,
   silent `return` on failure, `revalidatePath("/", "layout")` on success.
   RLS is the real gate — new tables get default-deny RLS policies in a new
   `supabase/migrations/000N_*.sql`, also appended to `setup-all.sql`.
