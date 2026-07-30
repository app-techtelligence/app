# "Cume" Visual Direction — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the "Cume" visual direction on the Home page and the internal `/styleguide` registry of `apps/web`, and clean the four hygiene problems left in the `feature/ui-redesign` working tree.

**Architecture:** One new accent token (`signal`) whose safe usage is enforced by a unit test rather than by reviewer discipline; two new typefaces layered onto the existing Manrope; and one signature element — an animated triangular contour field drawn by a raw-WebGL fragment shader on the Home hero only. The shader's GLSL and WebGL plumbing live in a plain `.ts` module so they can be unit-tested with a fake GL context; the React component owns only lifecycle. Every other page keeps its current look until Phase 2.

**Tech Stack:** Next.js 16 App Router (React 19, TypeScript strict), Tailwind CSS v4 `@theme`, `next/font/google`, `next-intl`, raw WebGL (no new runtime dependency), Vitest, Cloudflare Workers via `@opennextjs/cloudflare`.

**Source spec:** `docs/superpowers/specs/2026-07-30-cume-visual-direction-design.md` (commit `c645398`).

## Global Constraints

Every task's requirements implicitly include this section.

- **Branch:** `feature/ui-redesign`. Do not merge to `main` during this plan.
- **Accent rule (spec §2.1) — the single most important constraint.** `signal` `#5AC8E0` is used **only on navy surfaces, only as light**. It is 7.4:1 on navy and 1.95:1 on white. It must never become a button fill, a link color, or a background. Task 2 installs a test that fails the build if `bg-signal` appears anywhere.
- **No new runtime dependencies.** The shader is raw WebGL. `framer-motion` and `lucide-react` are being removed, not replaced. Adding any npm runtime dependency in this plan is a plan violation.
- **Colors:** `navy #1A2A44`, `navy-deep #111B2E`, `steel #667080`, `steel-light #9AA3B0`, `canvas #F7F8FA`, **new** `signal #5AC8E0`. Emphasis is fill-vs-outline, never hue. Semantic red stays the only non-palette color. Legacy `accent*` aliases stay mapped onto navy/steel and stay off-limits in new code.
- **Typefaces:** Archivo (variable, `wdth` axis, used at `wdth 122`, weight 800) for display; Manrope for body/UI (unchanged); IBM Plex Mono (400/600) for data, labels and eyebrows at small sizes only. All three load via `next/font/google` with `subsets: ["latin", "latin-ext"]` — Portuguese requires `latin-ext`.
- **i18n:** every user-facing string exists in **both** `apps/web/messages/pt-BR.json` and `apps/web/messages/en.json`, added in the same commit. `apps/web/messages/messages.test.ts` fails on key drift or empty strings. Never hardcode user-facing text.
- **Build workarounds that must not regress (CLAUDE.md §8):** `next build --webpack` in `apps/web/package.json`; the `middleware.ts` filename; `nodeLinker: hoisted` in `pnpm-workspace.yaml`. Use **pnpm** only — never `npm install` in this workspace.
- **CSP:** `font-src 'self'`. `next/font/google` self-hosts fonts at build time, so **no CSP change is needed**. This has been verified against `apps/web/lib/security-headers.mjs`. If you find yourself editing the CSP, stop — you have gone off-plan.
- **Server Components by default.** Only `ContourField.tsx` is a Client Component. Hero text is server-rendered and must never depend on the shader mounting.
- **Accessibility:** WCAG AA contrast, visible focus on every interactive element on both light and navy surfaces, semantic HTML, `prefers-reduced-motion` honored. Mobile-first; verify at 375px.
- **Performance budget:** Lighthouse ≥ 90 mobile on Home. Pre-committed fallback if fonts push it under: drop IBM Plex Mono for `ui-monospace, SFMono-Regular, Menlo, monospace`. Archivo and Manrope are load-bearing and are not the ones to cut.
- **Commit style:** conventional commits, small, one concern each.

## Scope Boundary

**In Phase 1:** design tokens, three typefaces, `contour-shader.ts`, `ContourField`, `ContourBand`, `ProofStrip`, the Home hero, `/styleguide` as the living registry, the button radius revert, the `framer-motion` removal, and all four hygiene items.

**Not in Phase 1:** `/consulting`, `/consulting/ai`, `/consulting/data-governance`, `/course`, `/mentorship`, `/about`, `/blog`, `/contact`, `/privacy`, and the per-page section reordering. Those are Phase 2 and get their own spec.

**Spec §6 vs §9 — resolved here.** §6 says `TriangleDivider` "is retired"; §9 scopes Phase 1 to Home + `/styleguide`. `TriangleDivider` currently has **nine** call sites, seven of which are on Phase 2 pages. Retiring it wholesale would drag Phase 2 pages into this plan. **Resolution: Phase 1 introduces `ContourBand` and swaps only the Home call site (`CredibilityBand.tsx`). `TriangleDivider` stays in the tree, untouched, for the other eight call sites. Full retirement is Phase 2 work.** Do not delete `TriangleDivider.tsx` in this plan.

## File Structure

New files:

| Path | Responsibility |
|---|---|
| `apps/web/lib/color.ts` | Pure sRGB contrast math. No React, no DOM. |
| `apps/web/lib/color.test.ts` | Verifies the math against known pairs. |
| `apps/web/lib/design-tokens.test.ts` | Reads `globals.css` and enforces the §2.1 accent rule mechanically. |
| `apps/web/lib/sitemap-routes.ts` | Splits `routing.pathnames` into public (sitemap-eligible) and internal. |
| `apps/web/lib/sitemap-routes.test.ts` | Asserts `/styleguide` is internal and never sitemap-eligible. |
| `apps/web/lib/contour-shader.ts` | GLSL source + WebGL program factory + DPR clamp. No React. |
| `apps/web/lib/contour-shader.test.ts` | Fake-GL tests for the factory and the geometry guard. |
| `apps/web/components/sections/home/ContourField.tsx` | Client Component: canvas, rAF loop, IntersectionObserver, reduced motion, WebGL-absent fallback. |
| `apps/web/components/sections/home/ProofStrip.tsx` | Server Component: the mono proof row. |
| `apps/web/components/ui/ContourBand.tsx` | Server Component: static SVG contour divider. |

Modified files: `apps/web/app/globals.css`, `apps/platform/app/globals.css`, `apps/web/app/[locale]/layout.tsx`, `apps/web/app/sitemap.ts`, `apps/web/i18n/routing.ts`, `apps/web/components/ui/Button.tsx`, `apps/web/components/layout/Header.tsx`, `apps/web/components/sections/home/Hero.tsx`, `apps/web/components/sections/home/CredibilityBand.tsx`, `apps/web/app/[locale]/styleguide/page.tsx`, `apps/web/messages/pt-BR.json`, `apps/web/messages/en.json`, `package.json`, `apps/web/package.json`, `.gitignore`, `docs/style-guide.md`.

Deleted: `apps/web/components/layout/ServicesDropdown.tsx`, `package-lock.json`.

## Testing Reality — read before Task 1

`apps/web/vitest.config.ts` has `include: ["**/*.test.ts"]` — **`.ts` only, not `.tsx`** — and configures **no** jsdom environment and no React Testing Library. Component rendering tests are therefore impossible without adding dependencies, and the Global Constraints forbid that.

**Consequence: do not attempt to write component tests.** TDD in this plan targets the pure-logic layer, which is where the real risk lives: the contrast rule, the sitemap filter, and the WebGL program factory. Component correctness is verified by the manual gates in Task 10. This is a deliberate decision, not an oversight — do not "fix" it by installing jsdom.

---

### Task 1: Clean the branch

Four hygiene problems from spec §8, plus the dependency-coupled dropdown revert. These are one task because they share a single verification gate: the build is green and `git status` is clean. `framer-motion` cannot be removed from `package.json` while `ServicesDropdown.tsx` still imports it, so the revert belongs here.

**Files:**
- Restore: `docs/style-guide.md` (from `HEAD`)
- Delete: `package-lock.json`, `apps/web/components/layout/ServicesDropdown.tsx`
- Modify: `package.json`, `apps/web/package.json`, `apps/web/components/layout/Header.tsx`, `apps/web/components/ui/Button.tsx`, `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `buttonVariants(variant, size, className?)` keeps its exact signature — only the `base` string changes. `Header.tsx` regains a module-scope `serviceLinks` const. No exported API changes.

- [ ] **Step 1: Restore the corrupted style guide**

`docs/style-guide.md` was pasted from an LLM chat export: it carries `[cite: 1]` markers on nearly every line and dropped from 172 lines to 72. Discard the working-tree version.

```bash
git checkout HEAD -- docs/style-guide.md
```

Verify it came back at 172 lines and has no citation markers:

```bash
wc -l < docs/style-guide.md
grep -c "\[cite:" docs/style-guide.md || echo "no citation markers — good"
```

Expected: `172`, then `no citation markers — good`.

- [ ] **Step 2: Remove the npm lockfile and stray root dependencies**

`npm install` was run inside this pnpm workspace. The root `package.json` of a Turborepo should carry only `turbo`.

```bash
rm -f package-lock.json
```

Replace `package.json` at the repo root with exactly this — note the `dependencies` block is gone entirely:

```json
{
  "name": "techtelligence",
  "private": true,
  "packageManager": "pnpm@11.10.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "preview": "turbo run preview",
    "deploy": "turbo run deploy"
  },
  "devDependencies": {
    "turbo": "^2.10.4"
  }
}
```

`lucide-react` is imported nowhere in the repo — this has been verified with a full-tree grep for `from "lucide-react"` — so it is removed outright, not relocated.

- [ ] **Step 3: Drop framer-motion from the web app**

In `apps/web/package.json`, delete the `"framer-motion": "^12.42.2",` line from `dependencies`. The result keeps every other entry unchanged:

```json
  "dependencies": {
    "@marsidev/react-turnstile": "^1.5.3",
    "@opennextjs/cloudflare": "^1.20.1",
    "@supabase/supabase-js": "^2.110.1",
    "next": "16.2.10",
    "next-intl": "^4.13.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1",
    "resend": "^6.17.1",
    "zod": "^4.4.3"
  },
```

- [ ] **Step 4: Delete the client dropdown and restore the CSS one**

```bash
rm apps/web/components/layout/ServicesDropdown.tsx
```

The committed dropdown opens on `:hover` and `:focus-within`, so it needs no client JavaScript at all — and removing it returns `Header.tsx` to a pure Server Component. Rewrite `apps/web/components/layout/Header.tsx` to exactly this. It restores the `HEAD` dropdown markup while **keeping** the branch's `h-20` bar and `gap-8` nav spacing, which the spec keeps:

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { StaticAppPathname } from "@/i18n/routing";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";

const links: {
  href: StaticAppPathname;
  key: "course" | "mentorship" | "blog" | "about";
}[] = [
  { href: "/course", key: "course" },
  { href: "/mentorship", key: "mentorship" },
  { href: "/blog", key: "blog" },
  { href: "/about", key: "about" },
];

const serviceLinks: {
  href: StaticAppPathname;
  key: "servicesAi" | "servicesDataGovernance";
}[] = [
  { href: "/consulting/ai", key: "servicesAi" },
  { href: "/consulting/data-governance", key: "servicesDataGovernance" },
];

export async function Header() {
  const t = await getTranslations("common");

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-white/95 backdrop-blur">
      <Container className="relative flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-20">
          {/* No aria-label: the visible wordmark text is the accessible name. */}
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-8 w-auto text-navy" />
            <Wordmark className="text-sm sm:text-base" />
          </Link>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label={t("nav.home")}
          >
            {/* CSS-only dropdown: opens on hover and on keyboard focus of any
                item inside (focus-within), so the Header stays a Server Component. */}
            <div className="group relative">
              <Link
                href="/consulting"
                className="flex items-center gap-1 text-sm font-semibold text-navy/75 transition-colors hover:text-navy"
              >
                {t("nav.services")}
                <ChevronDownIcon
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180"
                />
              </Link>
              {/* pt-2 bridges the hover gap between the trigger and the panel. */}
              <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="w-64 rounded-2xl border border-navy/5 bg-white p-2 shadow-lg shadow-navy/10">
                  {serviceLinks.map(({ href, key }) => (
                    <Link
                      key={href}
                      href={href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-navy/80 transition-colors hover:bg-canvas hover:text-navy"
                    >
                      {t(`nav.${key}`)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {links.map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold text-navy/75 transition-colors hover:text-navy"
              >
                {t(`nav.${key}`)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {/* Wrapper owns the responsive visibility: buttonVariants() hardcodes
              `inline-flex` in its base, which would override a `hidden` placed
              directly on the link and keep the button visible on mobile. */}
          <div className="hidden md:block">
            <Link href="/contact" className={buttonVariants("primary", "md")}>
              {t("nav.contact")}
            </Link>
          </div>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
```

- [ ] **Step 5: Revert the button radius to `rounded-lg`**

Pills read friendly/consumer; the direction is precise/technical. In `apps/web/components/ui/Button.tsx`, replace the comment and `base` const (lines 6–10) with:

```tsx
// Square-ish radius, not a pill: the "Cume" direction pairs Archivo Expanded
// and Plex Mono with contour geometry, and a pill fights that. Disabled buttons
// get `pointer-events-none`, so the hover elevation never fires on them.
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md disabled:pointer-events-none disabled:opacity-60";
```

Leave `variants`, `sizes`, `buttonVariants()` and `Button` exactly as they are.

- [ ] **Step 6: Stop tracking the image workspace**

`images/` holds ~51 MB of untracked PNGs, banners and a zip. R2 is already the source of truth for blog covers. In `.gitignore`, immediately after the existing `/blog-covers/` block, add:

```
# local image workspace (originals, banners, exports) — never in git
/images/
```

- [ ] **Step 7: Reinstall with pnpm and verify the tree is clean**

```bash
pnpm install
```

Expected: completes without error and does **not** recreate `package-lock.json`.

```bash
git status --porcelain
```

Expected: no `package-lock.json` line, no `images/` line, no `ServicesDropdown.tsx` line other than its deletion, and no `docs/style-guide.md` modification.

- [ ] **Step 8: Verify the whole workspace still builds and passes**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: all three green. `typecheck` is the one that proves no stale `framer-motion` import survives.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore(web): clean the redesign branch before the visual direction

Restores the style guide corrupted by an LLM paste, removes the npm
lockfile and the root dependencies npm added to a pnpm workspace, and
reverts the Serviços dropdown to the CSS version so Header goes back to
being a Server Component and framer-motion can leave. Buttons return to
rounded-lg for the new direction."
```

---

### Task 2: The `signal` token and the rule that keeps it safe

Spec §2.1 says the accent rule is a rule, not a guideline, because the failure mode — cyan spreading onto buttons and links until the site is generic cyan-on-navy SaaS — is invisible in any single code review. This task makes the rule mechanical.

**Files:**
- Create: `apps/web/lib/color.ts`, `apps/web/lib/color.test.ts`, `apps/web/lib/design-tokens.test.ts`
- Modify: `apps/web/app/globals.css`, `apps/platform/app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: `contrastRatio(a: string, b: string): number` and `relativeLuminance(hex: string): number` from `@/lib/color`. CSS custom property `--color-signal` and the Tailwind utility family `*-signal`. CSS class `.on-navy`, which retargets `:focus-visible` to the signal ring for descendants.

- [ ] **Step 1: Write the failing contrast-math test**

Create `apps/web/lib/color.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "./color";

describe("relativeLuminance", () => {
  it("anchors at the sRGB extremes", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("accepts shorthand and lowercase hex", () => {
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#1a2a44")).toBeCloseTo(
      relativeLuminance("#1A2A44"),
      10,
    );
  });
});

describe("contrastRatio", () => {
  it("returns 21 for black on white, in either order", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  // Spec §2.1 — these two numbers are the entire justification for the
  // "signal only on navy" rule. If they ever change, the rule needs rewriting.
  it("matches the spec's measured pairs for signal", () => {
    expect(contrastRatio("#5AC8E0", "#1A2A44")).toBeCloseTo(7.39, 1);
    expect(contrastRatio("#5AC8E0", "#FFFFFF")).toBeCloseTo(1.95, 2);
  });

  it("confirms steel is AA on white", () => {
    expect(contrastRatio("#667080", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
pnpm --filter web test -- color
```

Expected: FAIL — `Failed to resolve import "./color"`.

- [ ] **Step 3: Implement the color module**

Create `apps/web/lib/color.ts`:

```ts
/** WCAG 2.1 sRGB contrast math. Pure — no DOM, no dependencies. */

function expand(hex: string): string {
  const raw = hex.replace("#", "");
  return raw.length === 3
    ? raw
        .split("")
        .map((c) => c + c)
        .join("")
    : raw;
}

/** Undo the sRGB transfer function for one 0–255 channel. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = expand(hex);
  const r = linearize(parseInt(rgb.slice(0, 2), 16));
  const g = linearize(parseInt(rgb.slice(2, 4), 16));
  const b = linearize(parseInt(rgb.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
pnpm --filter web test -- color
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing token-rule test**

This is the test that enforces spec §2.1 for the life of the project. Create `apps/web/lib/design-tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./color";

const webCss = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
);
const platformCss = readFileSync(
  fileURLToPath(
    new URL("../../platform/app/globals.css", import.meta.url),
  ),
  "utf8",
);

function token(css: string, name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!match) throw new Error(`--color-${name} is not defined`);
  return match[1];
}

describe("brand tokens", () => {
  it("defines signal in both apps with the same value", () => {
    expect(token(webCss, "signal").toLowerCase()).toBe("#5ac8e0");
    expect(token(platformCss, "signal").toLowerCase()).toBe("#5ac8e0");
  });

  /**
   * Spec §2.1: signal is legible on navy and illegible on white. The rule
   * "only on navy, only as light" is derived from these two numbers, so the
   * numbers are asserted rather than trusted.
   */
  it("keeps signal AA on navy and proves it fails on white", () => {
    const signal = token(webCss, "signal");
    expect(contrastRatio(signal, token(webCss, "navy"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(signal, "#FFFFFF")).toBeLessThan(3);
  });

  it("keeps the existing text tokens AA on their own surfaces", () => {
    expect(contrastRatio(token(webCss, "steel"), "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(token(webCss, "steel-light"), token(webCss, "navy")),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
```

- [ ] **Step 6: Run it and watch it fail**

```bash
pnpm --filter web test -- design-tokens
```

Expected: FAIL — `--color-signal is not defined`.

- [ ] **Step 7: Add the token to both apps**

In `apps/web/app/globals.css`, inside `@theme`, insert the `signal` token after the `--color-canvas` line and before the legacy-alias comment:

```css
  --color-canvas: #f7f8fa;
  /* The one accent (spec §2.1). 7.4:1 on navy, 1.95:1 on white — so it is
     permitted ONLY on navy surfaces, only as light: contour glow, active
     state, focus ring. Never a button fill, link color, or background. */
  --color-signal: #5ac8e0;
```

Then retarget the focus ring for dark surfaces. In the same file's `@layer base`, replace the existing `:focus-visible` block with:

```css
  /* Steel reads on white but nearly vanishes on navy — dark surfaces opt in
     to the signal ring by carrying `.on-navy`. */
  :focus-visible {
    outline: 2px solid var(--color-steel);
    outline-offset: 2px;
  }

  .on-navy :focus-visible {
    outline-color: var(--color-signal);
  }
```

Apply the identical token addition to `apps/platform/app/globals.css` (the same `--color-signal` line with the same comment, inside its `@theme` block). The platform does not use it in Phase 1; defining it in both prevents the two files from drifting, per the existing convention that they change together.

- [ ] **Step 8: Run it and watch it pass**

```bash
pnpm --filter web test -- design-tokens
```

Expected: PASS, 3 tests.

- [ ] **Step 9: Add the misuse guard**

This is the mechanical version of spec §11's failure condition — "if `signal` ever appears as a button fill or a link color, the direction has failed".

First widen the existing imports at the **top** of `apps/web/lib/design-tokens.test.ts` (ESLint's `import/first` rejects imports placed lower in the file):

```ts
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
```

Then append this block to the end of the file:

```ts
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".open-next")
      continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("signal usage rule", () => {
  const appRoot = fileURLToPath(new URL("..", import.meta.url));

  it("never uses signal as a background fill", () => {
    const offenders = sourceFiles(appRoot).filter((file) =>
      /\bbg-signal\b/.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("never puts signal in the Button variants", () => {
    const button = readFileSync(join(appRoot, "components/ui/Button.tsx"), "utf8");
    expect(button).not.toMatch(/signal/);
  });
});
```

- [ ] **Step 10: Run the full suite**

```bash
pnpm --filter web test
```

Expected: PASS — the two new files plus the three pre-existing suites (`contact` schema, `contact` route, message parity).

- [ ] **Step 11: Commit**

```bash
git add apps/web/lib/color.ts apps/web/lib/color.test.ts apps/web/lib/design-tokens.test.ts apps/web/app/globals.css apps/platform/app/globals.css
git commit -m "feat(web): add the signal accent and enforce its usage rule in tests

signal is 7.4:1 on navy and 1.95:1 on white, so it is only ever light on
a dark surface. That constraint is easy to state and easy to erode one
review at a time, so it ships as a test rather than a convention."
```

---

### Task 3: Register `/styleguide` without leaking it into the sitemap

The `/styleguide` page exists but is absent from `routing.ts`, so next-intl's middleware never rewrites it and the PT route does not resolve. The naive fix — adding it to `pathnames` — silently publishes it, because `apps/web/app/sitemap.ts` maps over **every** key of `routing.pathnames`. This task does both halves.

**Files:**
- Create: `apps/web/lib/sitemap-routes.ts`, `apps/web/lib/sitemap-routes.test.ts`
- Modify: `apps/web/i18n/routing.ts`, `apps/web/app/sitemap.ts`

**Interfaces:**
- Consumes: `routing`, `AppPathname`, `StaticAppPathname` from `@/i18n/routing`.
- Produces: `INTERNAL_PATHNAMES: readonly AppPathname[]` and `publicStaticPathnames(): StaticAppPathname[]` from `@/lib/sitemap-routes`. Task 10 links to `/styleguide`, which requires it to be a valid `StaticAppPathname`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/lib/sitemap-routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { INTERNAL_PATHNAMES, publicStaticPathnames } from "./sitemap-routes";

describe("sitemap routes", () => {
  it("treats /styleguide as an internal route", () => {
    expect(INTERNAL_PATHNAMES).toContain("/styleguide");
  });

  it("keeps internal routes out of the sitemap", () => {
    const published = publicStaticPathnames();
    for (const internal of INTERNAL_PATHNAMES) {
      expect(published).not.toContain(internal);
    }
  });

  // Exact, not `toContain`. This is the backstop for the failure the module
  // exists to prevent: adding any route to routing.pathnames breaks this
  // assertion, which forces a deliberate choice — publish it by listing it
  // here, or hide it by listing it in INTERNAL_PATHNAMES. A `toContain` set
  // cannot detect an addition, so it would not catch a leaked internal route.
  it("publishes exactly the marketing pages and nothing else", () => {
    expect([...publicStaticPathnames()].sort()).toEqual([
      "/",
      "/about",
      "/blog",
      "/consulting",
      "/consulting/ai",
      "/consulting/data-governance",
      "/contact",
      "/course",
      "/mentorship",
      "/privacy",
    ]);
  });

  it("excludes dynamic segments, which get their entries from real data", () => {
    expect(publicStaticPathnames().every((href) => !href.includes("["))).toBe(true);
  });

  it("only ever returns keys that exist in the routing config", () => {
    const known = Object.keys(routing.pathnames);
    for (const href of publicStaticPathnames()) {
      expect(known).toContain(href);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
pnpm --filter web test -- sitemap-routes
```

Expected: FAIL — `Failed to resolve import "./sitemap-routes"`.

- [ ] **Step 3: Register the route**

In `apps/web/i18n/routing.ts`, add this entry to `pathnames`, immediately after the `"/privacy"` block and before the closing brace. The path is identical in both locales because the page is internal and never localized:

```ts
    // Internal design-system registry. Same path in both locales, kept out of
    // the sitemap by lib/sitemap-routes.ts and noindexed by its own metadata.
    "/styleguide": "/styleguide",
```

- [ ] **Step 4: Implement the split**

Create `apps/web/lib/sitemap-routes.ts`:

```ts
import { routing, type AppPathname, type StaticAppPathname } from "@/i18n/routing";

/**
 * Routes registered for navigation and middleware but deliberately unpublished.
 * They are noindexed at the page level too; this keeps them out of the sitemap,
 * which would otherwise advertise every key in routing.pathnames.
 */
export const INTERNAL_PATHNAMES: readonly AppPathname[] = ["/styleguide"];

/** Sitemap-eligible routes: public, and without a dynamic segment. */
export function publicStaticPathnames(): StaticAppPathname[] {
  return (Object.keys(routing.pathnames) as AppPathname[]).filter(
    (href): href is StaticAppPathname =>
      !href.includes("[") && !INTERNAL_PATHNAMES.includes(href),
  );
}
```

- [ ] **Step 5: Consume it in the sitemap**

In `apps/web/app/sitemap.ts`, delete the local `staticPathnames` const (and the now-unused `AppPathname` import), and import the helper instead. The imports at the top become:

```ts
import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type StaticAppPathname } from "@/i18n/routing";
import { publicStaticPathnames } from "@/lib/sitemap-routes";
import { siteConfig } from "@/lib/site-config";
import { listPublishedPosts } from "@/lib/blog";
```

and the first line of the `sitemap()` body becomes:

```ts
  const pages: MetadataRoute.Sitemap = publicStaticPathnames().map((href) => ({
```

Everything else in the file is unchanged.

- [ ] **Step 6: Run the test and watch it pass**

```bash
pnpm --filter web test -- sitemap-routes
```

Expected: PASS, 5 tests.

- [ ] **Step 7: Typecheck**

```bash
pnpm --filter web typecheck
```

Expected: clean. This is what catches a leftover `AppPathname` import in `sitemap.ts`.

- [ ] **Step 8: Verify both locales resolve**

```bash
pnpm --filter web dev
```

In another shell:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/styleguide
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/styleguide
curl -s http://localhost:3000/sitemap.xml | grep -c styleguide
```

Expected: `200`, `200`, then `0` — the page is reachable in both locales and absent from the sitemap. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add apps/web/i18n/routing.ts apps/web/lib/sitemap-routes.ts apps/web/lib/sitemap-routes.test.ts apps/web/app/sitemap.ts
git commit -m "fix(web): register /styleguide and keep internal routes unpublished

The page had no pathname entry, so the PT route never resolved. Adding
one would have published it, because the sitemap maps over every key in
routing.pathnames — hence the explicit internal-route split."
```

---

### Task 4: Load Archivo Expanded and IBM Plex Mono

Two families join Manrope. Archivo carries display type; Plex Mono carries data, labels and eyebrows at small sizes only. Both self-host through `next/font/google`, so `font-src 'self'` stays correct and no CSP edit is needed.

**Files:**
- Modify: `apps/web/app/[locale]/layout.tsx`, `apps/web/app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS variables `--font-archivo` and `--font-plex-mono` on `<html>`; the Tailwind utility `font-mono` (retargeted to Plex Mono); and a new custom utility **`display-expanded`**, which applies the Archivo family *and* `font-variation-settings: "wdth" 122` together. Tasks 8, 9 and 10 use `display-expanded` on headings and `font-mono` on data text.

- [ ] **Step 1: Register the fonts**

In `apps/web/app/[locale]/layout.tsx`, replace the `next/font/google` import and the `manrope` const (lines 3 and 12–16) with:

```tsx
import { Archivo, IBM_Plex_Mono, Manrope } from "next/font/google";
```

```tsx
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

// Variable font: omitting `weight` keeps the full range, and `axes` opts into
// the width axis so headings can be set at wdth 122 (spec §4).
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

// Static family — the two weights actually used are requested explicitly.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});
```

Then widen the `<html>` class so all three variables are in scope (line 40):

```tsx
    <html
      lang={locale}
      className={`${manrope.variable} ${archivo.variable} ${plexMono.variable}`}
    >
```

Leave `<body>` as it is — `font-sans` still resolves to Manrope, which remains the default for everything.

- [ ] **Step 2: Wire the families into the theme**

In `apps/web/app/globals.css`, replace the single `--font-sans` line at the end of the `@theme` block with:

```css
  --font-sans: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
  /* Data, labels and eyebrows only — IBM engineering-documentation heritage
     is the authority association the site was missing (spec §4). */
  --font-mono: var(--font-plex-mono), ui-monospace, SFMono-Regular, Menlo,
    monospace;
```

Then add the display utility at the **top level** of the file, after the `@theme` block closes and before `@layer base`:

```css
/* Display type is Archivo at width 122. Family and width axis ship together
   as one utility because setting either alone is always a mistake. */
@utility display-expanded {
  font-family: var(--font-archivo), ui-sans-serif, system-ui, sans-serif;
  font-variation-settings: "wdth" 122;
}
```

`font-variation-settings` names only the `wdth` axis, so `wght` still responds normally to Tailwind's `font-extrabold`.

- [ ] **Step 3: Prove the utility renders**

Temporarily add this to `apps/web/app/[locale]/styleguide/page.tsx`, immediately after the `<header>` element's closing tag:

```tsx
      <p className="display-expanded mt-10 text-4xl font-extrabold text-navy">
        Construímos Dados &amp; IA — ação, decisão, integração
      </p>
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-steel">
        STACK · DATABRICKS · DBT · AIRFLOW
      </p>
```

```bash
pnpm --filter web dev
```

Open `http://localhost:3000/styleguide` and confirm three things:
1. The first line is visibly **wider** per character than the Manrope heading above it — that is the `wdth` axis working. If it looks identical to Manrope, `axes: ["wdth"]` did not apply.
2. The accented characters `í`, `ã`, `õ` render correctly — that is `latin-ext` working.
3. The second line is monospaced.

Then **remove the temporary block** — Task 10 adds the permanent typography section. Stop the dev server.

- [ ] **Step 4: Verify the build and the budget are still intact**

```bash
pnpm --filter web build
```

Expected: success. Watch the route table — the First Load JS for `/` should not move, because fonts are CSS, not JS.

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/[locale]/layout.tsx apps/web/app/globals.css
git commit -m "feat(web): add Archivo Expanded and IBM Plex Mono

Archivo at wdth 122 reads as engineering and signage rather than startup,
and Plex Mono gives numbers and stack names the documentation register the
site had no way to express. Both self-host via next/font, so font-src
'self' is unchanged."
```

---

### Task 5: The contour shader module

Pure logic: GLSL source, the WebGL program factory, and the DPR clamp. No React, so it is testable in plain `.ts` against a fake GL context — which is the only meaningful automated coverage available for the signature element.

**Files:**
- Create: `apps/web/lib/contour-shader.ts`, `apps/web/lib/contour-shader.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces, all from `@/lib/contour-shader`:
  - `DPR_CAP: 1.5`
  - `clampDpr(raw: number): number`
  - `VERTEX_SHADER: string`, `FRAGMENT_SHADER: string`
  - `type ContourProgram = { resize(width: number, height: number): void; draw(time: number): void; dispose(): void }`
  - `createContourProgram(gl: WebGLRenderingContext): ContourProgram` — throws `Error` on compile or link failure, with the driver info log in the message.

  Task 6 consumes exactly these names.

- [ ] **Step 1: Write the failing test**

Create `apps/web/lib/contour-shader.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DPR_CAP,
  FRAGMENT_SHADER,
  VERTEX_SHADER,
  clampDpr,
  createContourProgram,
} from "./contour-shader";

/**
 * Minimal stand-in for WebGLRenderingContext. Only the calls the factory makes
 * are implemented; overrides let a test force a compile or link failure.
 */
function fakeGl(overrides: Record<string, unknown> = {}) {
  const calls: { name: string; args: unknown[] }[] = [];
  const record =
    (name: string, result?: unknown) =>
    (...args: unknown[]) => {
      calls.push({ name, args });
      return result;
    };

  const gl = {
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    TRIANGLES: 0x0004,
    createShader: record("createShader", { id: "shader" }),
    shaderSource: record("shaderSource"),
    compileShader: record("compileShader"),
    getShaderParameter: record("getShaderParameter", true),
    getShaderInfoLog: record("getShaderInfoLog", "syntax error on line 12"),
    deleteShader: record("deleteShader"),
    createProgram: record("createProgram", { id: "program" }),
    attachShader: record("attachShader"),
    linkProgram: record("linkProgram"),
    getProgramParameter: record("getProgramParameter", true),
    getProgramInfoLog: record("getProgramInfoLog", "link failed"),
    deleteProgram: record("deleteProgram"),
    useProgram: record("useProgram"),
    createBuffer: record("createBuffer", { id: "buffer" }),
    deleteBuffer: record("deleteBuffer"),
    bindBuffer: record("bindBuffer"),
    bufferData: record("bufferData"),
    getAttribLocation: record("getAttribLocation", 0),
    enableVertexAttribArray: record("enableVertexAttribArray"),
    vertexAttribPointer: record("vertexAttribPointer"),
    getUniformLocation: record("getUniformLocation", { id: "uniform" }),
    uniform1f: record("uniform1f"),
    uniform2f: record("uniform2f"),
    viewport: record("viewport"),
    drawArrays: record("drawArrays"),
    ...overrides,
  };

  return { gl: gl as unknown as WebGLRenderingContext, calls };
}

describe("clampDpr", () => {
  it("caps high-density screens", () => {
    // A DPR-3 phone would otherwise render 9x the pixels through a per-pixel
    // loop with five divisions.
    expect(clampDpr(3)).toBe(DPR_CAP);
    expect(clampDpr(2)).toBe(DPR_CAP);
  });

  it("leaves standard and unknown densities alone", () => {
    expect(clampDpr(1)).toBe(1);
    expect(clampDpr(1.25)).toBe(1.25);
    expect(clampDpr(Number.NaN)).toBe(1);
    expect(clampDpr(0)).toBe(1);
  });
});

describe("FRAGMENT_SHADER", () => {
  // The entire geometry change from the circular source material is the
  // distance function. If this reverts, the hero silently becomes a circle.
  it("uses the triangle SDF, not the source's radial distance", () => {
    expect(FRAGMENT_SHADER).toContain("float sdTri(");
    expect(FRAGMENT_SHADER).toContain("sdTri(uv,");
    expect(FRAGMENT_SHADER).not.toMatch(/float d\s*=\s*length\(uv\)/);
  });

  it("declares the uniforms the factory looks up", () => {
    expect(FRAGMENT_SHADER).toContain("uniform vec2 resolution;");
    expect(FRAGMENT_SHADER).toContain("uniform float time;");
  });

  it("has a vertex shader for the single covering triangle", () => {
    expect(VERTEX_SHADER).toContain("attribute vec2 p;");
  });
});

describe("createContourProgram", () => {
  it("compiles, links and uploads one oversized triangle", () => {
    const { gl, calls } = fakeGl();
    const program = createContourProgram(gl);

    expect(calls.filter((c) => c.name === "compileShader")).toHaveLength(2);
    expect(calls.some((c) => c.name === "linkProgram")).toBe(true);

    // Two triangles forming a quad would be 6 vertices; this is 3.
    const upload = calls.find((c) => c.name === "bufferData");
    expect(Array.from(upload?.args[1] as Float32Array)).toEqual([
      -1, -1, 3, -1, -1, 3,
    ]);
    expect(program.draw).toBeTypeOf("function");
  });

  it("throws with the driver log when a shader fails to compile", () => {
    const { gl } = fakeGl({ getShaderParameter: () => false });
    expect(() => createContourProgram(gl)).toThrow(/syntax error on line 12/);
  });

  it("throws with the driver log when the program fails to link", () => {
    const { gl } = fakeGl({ getProgramParameter: () => false });
    expect(() => createContourProgram(gl)).toThrow(/link failed/);
  });

  it("resize sets the viewport and the resolution uniform", () => {
    const { gl, calls } = fakeGl();
    createContourProgram(gl).resize(800, 400);

    expect(calls).toContainEqual({ name: "viewport", args: [0, 0, 800, 400] });
    const uniform = calls.find((c) => c.name === "uniform2f");
    expect(uniform?.args.slice(1)).toEqual([800, 400]);
  });

  it("draw pushes time and issues exactly one 3-vertex draw call", () => {
    const { gl, calls } = fakeGl();
    createContourProgram(gl).draw(12.5);

    const time = calls.find((c) => c.name === "uniform1f");
    expect(time?.args[1]).toBe(12.5);
    const draws = calls.filter((c) => c.name === "drawArrays");
    expect(draws).toHaveLength(1);
    expect(draws[0].args).toEqual([gl.TRIANGLES, 0, 3]);
  });

  it("dispose releases the program and the buffer", () => {
    const { gl, calls } = fakeGl();
    createContourProgram(gl).dispose();

    expect(calls.some((c) => c.name === "deleteProgram")).toBe(true);
    expect(calls.some((c) => c.name === "deleteBuffer")).toBe(true);
  });

  it("throws when createBuffer returns null", () => {
    const { gl } = fakeGl({ createBuffer: () => null });
    expect(() => createContourProgram(gl)).toThrow(
      "WebGL could not allocate a buffer",
    );
  });

  it("link failure releases both compiled shaders", () => {
    const { gl, calls } = fakeGl({ getProgramParameter: () => false });
    expect(() => createContourProgram(gl)).toThrow(/link failed/);
    expect(calls.filter((c) => c.name === "deleteShader")).toHaveLength(2);
  });
});

describe("clampDpr boundary", () => {
  it("passes through a DPR exactly at the cap", () => {
    expect(clampDpr(DPR_CAP)).toBe(DPR_CAP);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
pnpm --filter web test -- contour-shader
```

Expected: FAIL — `Failed to resolve import "./contour-shader"`.

- [ ] **Step 3: Implement the module**

Create `apps/web/lib/contour-shader.ts`:

```ts
/**
 * Triangular contour field — one fullscreen fragment shader, raw WebGL.
 *
 * The source material this derives from drew circles because its distance
 * function was `length(uv)`. Swapping in an equilateral-triangle SDF is the
 * whole geometry change; everything else is unchanged. Kept free of React so
 * the shader and the component lifecycle can move independently.
 */

/** A DPR-3 phone renders 9x the pixels through a five-division per-pixel loop. */
export const DPR_CAP = 1.5;

export function clampDpr(raw: number): number {
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(raw, DPR_CAP);
}

export const VERTEX_SHADER = `attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

export const FRAGMENT_SHADER = `precision highp float;
uniform vec2 resolution;
uniform float time;

// Inigo Quilez's equilateral-triangle signed distance function.
float sdTri(vec2 p, float r) {
  float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
  float t = time * 0.05;
  float lineWidth = 0.0022;
  float d = sdTri(uv, 0.55);
  float acc = 0.0;
  for (int i = 0; i < 5; i++) {
    acc += lineWidth * float(i * i) / abs(fract(t + float(i) * 0.01) * 5.0 - d + mod(uv.x + uv.y, 0.2));
  }
  // navy -> signal -> white. One intensity ramp, so the field obeys the
  // accent rule instead of the source's per-channel RGB fringing.
  vec3 navy   = vec3(0.102, 0.165, 0.267);
  vec3 deep   = vec3(0.067, 0.106, 0.180);
  vec3 signal = vec3(0.353, 0.784, 0.878);
  vec3 col = mix(deep, navy, gl_FragCoord.y / resolution.y);
  float glow = clamp(acc, 0.0, 2.0);
  col = mix(col, signal, clamp(glow, 0.0, 1.0));
  col = mix(col, vec3(1.0), clamp(glow - 1.0, 0.0, 1.0) * 0.75);
  gl_FragColor = vec4(col, 1.0);
}`;

export type ContourProgram = {
  resize(width: number, height: number): void;
  draw(time: number): void;
  dispose(): void;
};

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL could not allocate a shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Contour shader failed to compile: ${log}`);
  }
  return shader;
}

export function createContourProgram(gl: WebGLRenderingContext): ContourProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL could not allocate a program");

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.deleteProgram(program);
    throw new Error(`Contour program failed to link: ${log}`);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  gl.useProgram(program);

  // One oversized triangle covers the viewport — cheaper than two forming a quad.
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("WebGL could not allocate a buffer");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, "resolution");
  const uTime = gl.getUniformLocation(program, "time");

  return {
    resize(width, height) {
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
    },
    draw(time) {
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.useProgram(null);
      gl.deleteProgram(program);
    },
  };
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
pnpm --filter web test -- contour-shader
```

Expected: PASS, 14 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm --filter web typecheck
```

Expected: clean.

```bash
git add apps/web/lib/contour-shader.ts apps/web/lib/contour-shader.test.ts
git commit -m "feat(web): add the triangular contour shader module

Raw WebGL, no dependency — the effect is one fullscreen fragment shader,
so three.js would be ~150 KB carried for a scene graph nothing uses.
Keeping the GLSL out of React makes the geometry testable, including a
guard against silently reverting to the circular source."
```

---

### Task 6: The `ContourField` client component

Owns lifecycle and nothing else: acquire the context, size the canvas, run the frame loop, and stop doing all of that when the hero is offscreen, when motion is unwelcome, or when WebGL is missing.

**Files:**
- Create: `apps/web/components/sections/home/ContourField.tsx`

**Interfaces:**
- Consumes: `clampDpr`, `createContourProgram`, `ContourProgram` from `@/lib/contour-shader`.
- Produces: `<ContourField />` — no props. Absolutely positioned, `aria-hidden`, fills its nearest positioned ancestor. Renders an empty `<canvas>` on the server and when WebGL is unavailable, so the parent's own background must always be a complete design on its own.

- [ ] **Step 1: Write the component**

Create `apps/web/components/sections/home/ContourField.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import {
  clampDpr,
  createContourProgram,
  type ContourProgram,
} from "@/lib/contour-shader";

// Starting the clock mid-cycle avoids opening on a flat frame.
const SEED_TIME = 6;
const STEP = 0.05;

/**
 * Decorative triangular contour field for the Home hero. Presentational only —
 * every piece of hero content is server-rendered and readable without this.
 */
export function ContourField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    // No WebGL: leave the canvas blank and let the hero gradient stand alone.
    if (!gl) return;

    let program: ContourProgram;
    try {
      program = createContourProgram(gl);
    } catch {
      return;
    }

    let frame = 0;
    let time = SEED_TIME;
    // Read once at mount: reduced-motion users get a still frame, not a loop
    // that redraws the same pixels forever.
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = clampDpr(window.devicePixelRatio || 1);
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      if (width === 0 || height === 0) return;
      canvas.width = width;
      canvas.height = height;
      program.resize(width, height);
      program.draw(time);
    };

    const render = () => {
      time += STEP;
      program.draw(time);
      frame = requestAnimationFrame(render);
    };

    const start = () => {
      if (!animate || frame) return;
      frame = requestAnimationFrame(render);
    };

    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);

    // Nothing should burn GPU time while the hero is scrolled past.
    const viewObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    viewObserver.observe(canvas);

    resize();

    return () => {
      stop();
      sizeObserver.disconnect();
      viewObserver.disconnect();
      program.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
pnpm --filter web typecheck && pnpm --filter web lint
```

Expected: both clean. The component is not rendered anywhere yet — Task 8 mounts it.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/sections/home/ContourField.tsx
git commit -m "feat(web): add the ContourField canvas component

Lifecycle only: the shader lives in lib/. Pauses on IntersectionObserver,
renders a single still frame under prefers-reduced-motion, and returns
silently when WebGL is unavailable so the hero degrades to its gradient."
```

---

### Task 7: The proof strip

Spec §5 is explicit that this — not the shader — is what answers "no authority". Concrete numbers and stack names do the work.

**Files:**
- Create: `apps/web/components/sections/home/ProofStrip.tsx`
- Modify: `apps/web/messages/pt-BR.json`, `apps/web/messages/en.json`

**Interfaces:**
- Consumes: `getTranslations` from `next-intl/server`; message namespace `home.proof`.
- Produces: `<ProofStrip />` — no props, Server Component. Task 8 renders it inside the hero's navy surface.

- [ ] **Step 1: GATE — get the real numbers from the user**

**Do not invent these values and do not proceed past this step without them.** The prototype showed "12+ anos" as a placeholder; a full-tree search confirms the site currently makes **no numeric experience claim anywhere** and lists **no stack names** in any message catalog or in `lib/clients.ts`. Anything you write here would be a fabricated claim on a live commercial site.

Ask the user exactly this, and wait:

> Para a faixa de prova do hero preciso de três dados reais:
> 1. **Anos de experiência** — quantos anos em engenharia de dados o time soma? (ex.: "12+ anos em engenharia de dados")
> 2. **Stack** — quais três ou quatro tecnologias você quer nomear? (ex.: "Databricks · dbt · Airflow")
> 3. **Terceiro selo** — confirma "LGPD por padrão", ou prefere outra garantia?

Constraints to apply to the answers:
- The experience claim inherits the existing framing that this is **team experience, not TechTelligence clients** (CLAUDE.md §3). Word it about the team, never about a client roster.
- "LGPD por padrão" / "LGPD by default" is already grounded — LGPD compliance is claimed across the consulting, privacy and service pages — so it is safe to use verbatim if the user confirms it.
- If a real number is unavailable, **drop that slot and ship two items.** A vague proof strip is worse than a short one.

Record the confirmed answers directly in this plan file, replacing the three lines below, before writing any JSON:

```
CONFIRMED PT — experience: …
CONFIRMED PT — stack: …
CONFIRMED PT — compliance: …
```

- [ ] **Step 2: Add the strings to both catalogs**

In `apps/web/messages/pt-BR.json`, add a `proof` object inside `home`, immediately after the `hero` object. Use the confirmed PT values from Step 1:

```json
    "proof": {
      "experience": "<confirmed PT experience line>",
      "stack": "<confirmed PT stack line>",
      "compliance": "<confirmed PT compliance line>"
    },
```

In `apps/web/messages/en.json`, add the same three keys in the same position with the English equivalents. Translate rather than transliterate — "LGPD por padrão" becomes "LGPD-compliant by default", since LGPD is the Brazilian statute and keeps its name in English.

Both files change in the same commit; the parity test enforces it.

- [ ] **Step 3: Write the component**

Create `apps/web/components/sections/home/ProofStrip.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

/**
 * Concrete claims in mono, directly under the hero copy (spec §5). This is the
 * element that answers "the site doesn't convey authority" — the shader does
 * not. Lives on navy only: `signal` is illegible on light surfaces.
 */
export async function ProofStrip() {
  const t = await getTranslations("home.proof");
  const items = [t("experience"), t("stack"), t("compliance")];

  return (
    <ul className="mt-12 flex flex-col gap-3 border-t border-white/12 pt-6 font-mono text-xs tracking-[0.05em] text-steel-light sm:flex-row sm:flex-wrap sm:gap-x-9">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Verify parity and types**

```bash
pnpm --filter web test -- messages && pnpm --filter web typecheck
```

Expected: both pass. The parity test fails if a key landed in only one catalog or if any string is empty.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/sections/home/ProofStrip.tsx apps/web/messages/pt-BR.json apps/web/messages/en.json
git commit -m "feat(web): add the hero proof strip

Years, stack and compliance in mono, above the fold. The visual direction
fixes 'generic'; this is the part that fixes 'no authority'. Numbers
supplied by the user — nothing here is inferred."
```

---

### Task 8: Rebuild the Home hero

Everything from Tasks 2, 4, 6 and 7 becomes visible here for the first time.

**Files:**
- Modify: `docs/superpowers/specs/2026-07-30-cume-visual-direction-design.md`, `apps/web/components/sections/home/Hero.tsx`

**Interfaces:**
- Consumes: `<ContourField />`, `<ProofStrip />`, `display-expanded`, `font-mono`, `text-signal`, `.on-navy`.
- Produces: nothing new. `Hero` keeps its zero-prop signature and stays a Server Component.

- [ ] **Step 1: Amend spec §3 — the eyebrow is a fourth permitted use**

Spec §3 lists exactly three permitted uses for `signal` and the hero eyebrow is not among them, but the prototype the user approved rendered the eyebrow in cyan — it is the most visible "one accent" moment above the fold. Rather than let the code quietly contradict the spec, widen the spec.

In `docs/superpowers/specs/2026-07-30-cume-visual-direction-design.md` §3, change the sentence `signal has exactly three permitted uses:` to `signal has exactly four permitted uses:` and append this item to the numbered list:

```markdown
4. **Eyebrow / kicker on navy** — the small mono label above a heading, on dark surfaces only. This was in the approved prototype and is the accent's most visible moment; it is listed explicitly so it stays a decision rather than a drift.
```

```bash
git add docs/superpowers/specs/2026-07-30-cume-visual-direction-design.md
git commit -m "docs(web): allow signal on navy eyebrows

The approved prototype set the hero kicker in cyan, which §3's list of
three uses did not cover. Widening the list keeps the rule enforceable
instead of letting the first exception be an undocumented one."
```

- [ ] **Step 2: Rewrite the hero**

Replace `apps/web/components/sections/home/Hero.tsx` entirely:

```tsx
import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ContourField } from "./ContourField";
import { ProofStrip } from "./ProofStrip";

export async function Hero() {
  const t = await getTranslations("home.hero");

  return (
    // `on-navy` switches :focus-visible to the signal ring; the gradient is a
    // complete background on its own, so the canvas is free to not render.
    <section className="on-navy relative isolate overflow-hidden bg-gradient-to-b from-navy to-navy-deep">
      <ContourField />
      {/* AA substrate: the field's crest hits rgb(214,241,247), where white text
          is 1.2:1. Masked off the empty right column on lg so the field survives. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy/94 to-navy-deep/94 lg:[mask-image:linear-gradient(to_right,black_72%,transparent_92%)]"
      />
      <Container className="relative z-10 py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-signal">
            {t("kicker")}
          </p>
          <h1 className="display-expanded mt-6 text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink(t("whatsappMessage"))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants("onDark", "lg")}
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t("ctaPrimary")}
            </a>
            <a href="#solutions" className={buttonVariants("onDarkOutline", "lg")}>
              {t("ctaSecondary")}
            </a>
          </div>
          <ProofStrip />
        </div>
      </Container>
    </section>
  );
}
```

The `LogoMark` watermark is gone. It was a second, unrelated way of saying "triangle" on the same surface the contour field now owns; keeping both is noise. `tracking-wide` on the h1 becomes `tracking-tight` because Archivo Expanded is already wide — letter-spacing on top of the width axis reads as strain.

- [ ] **Step 3: Check the headline length against the new width**

```bash
pnpm --filter web dev
```

Open `http://localhost:3000` and `http://localhost:3000/en`. Archivo Expanded consumes noticeably more horizontal space than Manrope, so the current PT headline may now wrap badly or overflow.

- If both headlines hold at 375px and at desktop, change nothing.
- If either breaks, shorten `home.hero.title` in **both** catalogs — this is a copy constraint the spec anticipated (§4), not a CSS problem. Do not solve it by shrinking the type scale.

- [ ] **Step 4: Verify the four hero behaviors**

Still on `http://localhost:3000`:

1. **Shader renders.** Triangular contour lines animate behind the copy, cyan on navy. If the field is circular, `FRAGMENT_SHADER` regressed — Task 5's test should have caught it.
2. **Reduced motion.** In DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", reload. The field must still be **visible** but completely **still**.
3. **No WebGL.** In DevTools → Settings → Preferences, disable WebGL (or run Chrome with `--disable-webgl`) and reload. The hero must show the plain navy gradient with all text and both buttons perfectly readable.
4. **Focus ring.** Tab to the two hero CTAs. The ring must be cyan and clearly visible. Tab to the header's Contact button — that ring must still be steel, because the header is not inside `.on-navy`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/sections/home/Hero.tsx
git commit -m "feat(web): rebuild the Home hero on the contour field

Archivo Expanded for the headline, a mono cyan kicker, the proof strip
under the CTAs, and the triangular contour field behind all of it. Drops
the logo watermark — the field is now the geometry, and two versions of
the same idea on one surface is just noise."
```

---

### Task 9: `ContourBand` and the Home swap

The same geometry at lower volume, with zero JavaScript, so surfaces other than the hero speak the same language.

**Files:**
- Create: `apps/web/components/ui/ContourBand.tsx`
- Modify: `apps/web/components/sections/home/CredibilityBand.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `<ContourBand tone?: "navy" | "steel" | "white" className?: string />`, Server Component. Task 10 registers it in the styleguide.

**Reminder — do not delete `TriangleDivider.tsx`.** It still has eight call sites on Phase 2 pages. Only the Home call site moves in this plan.

- [ ] **Step 1: Write the band**

Create `apps/web/components/ui/ContourBand.tsx`:

```tsx
type ContourBandProps = {
  /** Match the surface: steel on light, white or navy on dark. */
  tone?: "navy" | "steel" | "white";
  className?: string;
};

const tones = {
  navy: "text-navy/15",
  steel: "text-steel/30",
  white: "text-white/20",
} as const;

/**
 * Static contour divider — the same nested triangular isolines the hero shader
 * draws, held still. Pure SVG: the animated field is the Home hero's signature
 * and stays exclusive to it (spec §6).
 */
export function ContourBand({ tone = "navy", className }: ContourBandProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex justify-center ${tones[tone]} ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 240 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="h-10 w-60"
      >
        <path d="M60 38 120 6l60 32" />
        <path d="M76 38 120 14l44 24" opacity="0.7" />
        <path d="M92 38 120 22l28 16" opacity="0.45" />
        <path d="M108 38 120 30l12 8" opacity="0.25" />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Swap the Home call site**

In `apps/web/components/sections/home/CredibilityBand.tsx`, change the import on line 5 and the element on line 14, and add `on-navy` to the section so any focus ring inside it is the cyan one:

```tsx
import { ContourBand } from "@/components/ui/ContourBand";
```

```tsx
    <section className="on-navy bg-navy py-16 text-center sm:py-20">
      <Container className="flex flex-col items-center">
        <ContourBand tone="white" />
```

Leave the heading, body, and CTA untouched — this task changes the divider and the focus ring, nothing else.

- [ ] **Step 3: Verify**

```bash
pnpm --filter web dev
```

On `http://localhost:3000`, scroll to the credibility band. The nested triangle isolines should read as a quieter, still version of the hero field. Tab to its "Sobre nós" link and confirm the focus ring is cyan.

```bash
pnpm --filter web typecheck && pnpm --filter web lint
```

Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/ui/ContourBand.tsx apps/web/components/sections/home/CredibilityBand.tsx
git commit -m "feat(web): add ContourBand and use it on the Home credibility band

Static isolines of the same triangle the hero shader draws, so dividers
stop being a third unrelated vocabulary. TriangleDivider stays for the
eight Phase 2 call sites."
```

---

### Task 10: Register the direction and clear the gates

The styleguide becomes the living record of the direction, `docs/style-guide.md` becomes its written form, and spec §10's seven gates all have to pass.

**Files:**
- Modify: `apps/web/app/[locale]/styleguide/page.tsx`, `docs/style-guide.md`

**Interfaces:**
- Consumes: everything built in Tasks 2, 4, 8 and 9.
- Produces: nothing consumed by later tasks — this is the last one.

- [ ] **Step 1: Add `signal` to the styleguide palette**

The obvious version of this step — a `bg-signal` tile — fails Task 2's guard test, and the guard is right: a swatch tile is a background fill, and the registry does not get an exception to the one rule it exists to document. So the new entry paints from its hex instead.

In `apps/web/app/[locale]/styleguide/page.tsx`, first teach `ColorSwatch` the inline path by replacing the whole `ColorSwatch` function:

```tsx
function ColorSwatch({ name, hex, swatch, note }: Swatch) {
  return (
    <figure className="flex flex-col gap-3">
      {/* An empty `swatch` means paint from the hex: `bg-signal` is banned by
          lib/design-tokens.test.ts and must stay unavailable everywhere. */}
      <div
        className={`h-24 w-full rounded-xl border border-navy/10 ${swatch}`}
        style={swatch === "" ? { backgroundColor: hex } : undefined}
      />
      <figcaption className="space-y-1">
        <div className="text-sm font-bold text-navy">{name}</div>
        <div className="font-mono text-xs text-steel">{hex}</div>
        <div className="text-xs leading-relaxed text-steel">{note}</div>
      </figcaption>
    </figure>
  );
}
```

Then append this fifth entry to the `PALETTE` array, after the `white` entry:

```tsx
  {
    name: "signal",
    hex: "#5AC8E0",
    swatch: "",
    note: "ONLY on navy, only as light — 7.4:1 on navy, 1.95:1 on white",
  },
```

The `Swatch` type is unchanged. The four existing entries keep their `bg-*` classes and are unaffected.

- [ ] **Step 2: Replace the typography section**

The existing section is titled `Manrope` and describes one family. Replace the whole `{/* Typography */}` `<Section>` element with:

```tsx
        {/* Typography */}
        <Section
          eyebrow="Archivo · Manrope · IBM Plex Mono"
          title="Typography"
          description="Archivo at wdth 122 carries display type; Manrope carries body and UI; IBM Plex Mono is reserved for data, labels and eyebrows at small sizes. Never set body copy in Archivo or Plex Mono."
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-steel">
                Display H1 · display-expanded / extrabold / text-5xl
              </span>
              <p className="display-expanded text-4xl font-extrabold leading-[1.04] tracking-tight text-navy sm:text-5xl">
                Dados que sustentam decisão.
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-steel">
                Display H2 · display-expanded / extrabold / text-3xl
              </span>
              <p className="display-expanded text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                Construímos Dados &amp; IA para empresas.
              </p>
            </div>
            <div className="max-w-2xl space-y-2">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-steel">
                Body · Manrope / leading-relaxed
              </span>
              <p className="leading-relaxed text-navy">
                Body copy stays in Manrope with relaxed leading. Direct
                sentences, no corporate jargon — professional but encouraging.
                Archivo Expanded is wide, so headlines have to be shorter than
                they used to be; that is a copy constraint, not a CSS one.
              </p>
            </div>
            <div className="max-w-2xl space-y-2">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-steel">
                Data · font-mono / uppercase / tracking-[0.05em]
              </span>
              <p className="font-mono text-xs tracking-[0.05em] text-steel">
                12+ ANOS · DATABRICKS · DBT · AIRFLOW · LGPD
              </p>
            </div>
          </div>
        </Section>
```

The mono sample line is illustrative registry text, not a site claim — the real values live in `home.proof` from Task 7.

- [ ] **Step 3: Fix the button description and add a contour section**

The Buttons section still describes the pill. Change its `description` prop to:

```tsx
          description="rounded-lg with a hover lift (motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md). Emphasis is fill vs. outline, never hue — signal is never a button fill."
```

Then add a new `<Section>` immediately after the Cards section, before the closing `</div>`:

```tsx
        {/* Contour geometry */}
        <Section
          eyebrow="Signature"
          title="Contour geometry"
          description="The animated triangular field is exclusive to the Home hero. Everywhere else the same geometry appears as a static SVG band — zero JavaScript, same language, lower volume."
        >
          <div className="space-y-6">
            <div className="rounded-2xl bg-canvas p-10">
              <ContourBand tone="steel" />
            </div>
            <div className="on-navy rounded-2xl bg-navy p-10">
              <ContourBand tone="white" />
              <p className="mt-6 text-center font-mono text-xs tracking-[0.05em] text-signal">
                SIGNAL IS LEGIBLE HERE — AND ONLY HERE
              </p>
            </div>
          </div>
        </Section>
```

Add the import at the top of the file:

```tsx
import { ContourBand } from "@/components/ui/ContourBand";
```

- [ ] **Step 4: Rewrite the written style guide**

`docs/style-guide.md` was restored from `HEAD` in Task 1 and still describes the pre-"Cume" system. Update these four things and leave everything else intact:

1. **Color section** — add `signal #5A C8E0` with the measured 7.4:1 / 1.95:1 pair and the four permitted uses from spec §3 (contour glow, active state on navy, focus ring on navy, eyebrow on navy). State plainly that it is never a button fill, link color, or background, and that `apps/web/lib/design-tokens.test.ts` enforces this.
2. **Typography section** — replace "Manrope for everything" with the three-family split: Archivo via `display-expanded` for h1/h2, Manrope for body and UI, IBM Plex Mono for data/labels/eyebrows at small sizes. Note the shorter-headline constraint.
3. **Component idioms** — buttons are `rounded-lg`, not pills. Add `ContourBand` with its three tones, and record that `TriangleDivider` is deprecated and retires in Phase 2.
4. **New-page checklist** — add two lines: "dark surfaces carry `.on-navy` so the focus ring is visible" and "signal never appears on a light surface".

Keep the file's existing voice and heading structure. Do not paste anything resembling `[cite: N]` markers.

- [ ] **Step 5: Gates 1 and 7 — suite and working tree**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: green, including message parity, the contrast rule, the `bg-signal` guard, the sitemap filter, and the shader tests.

```bash
git status --porcelain
```

Expected: no `package-lock.json`, no `images/`.

- [ ] **Step 6: Gate 2 — the Cloudflare adapter**

This is the gate that catches runtime incompatibility, and it is the one most likely to fail late.

```bash
pnpm --filter web preview
```

Expected: `opennextjs-cloudflare build` completes and the preview serves. Load `/`, `/en`, `/styleguide` and `/en/styleguide` and confirm the hero shader runs under the worker exactly as it did under `next dev`. Confirm `next build --webpack` and the `middleware.ts` filename are both untouched.

- [ ] **Step 7: Gates 3–6 — budget, degradation, focus, mobile**

1. **Lighthouse mobile ≥ 90 on Home.** Run it against the preview build, not `next dev`. If three font families push it under, apply the spec §4 fallback: remove `IBM_Plex_Mono` from `layout.tsx` and point `--font-mono` at `ui-monospace, SFMono-Regular, Menlo, monospace`. Archivo and Manrope stay.
2. **Degradation.** With WebGL disabled *and* `prefers-reduced-motion: reduce` set, Home is fully readable and correctly laid out.
3. **Focus.** Tab the whole Home page top to bottom. Every interactive element shows a visible ring — steel on light surfaces, cyan inside `.on-navy`.
4. **375px.** Home and `/styleguide` at 375px: no horizontal scroll, no clipped headline, proof strip stacks vertically.

- [ ] **Step 8: Commit**

```bash
git add apps/web/app/[locale]/styleguide/page.tsx docs/style-guide.md
git commit -m "docs(web): register the Cume direction in the styleguide

The styleguide is where the direction gets validated, so it now carries
the signal swatch with its contrast numbers, the three-family type scale,
and both ContourBand tones. Swatches paint from hex because bg-signal is
banned by the token test — the registry does not get an exception to the
rule it exists to document."
```

---

## Notes for the implementer

**Two steps block on the user and cannot be worked around:**
- **Task 7 Step 1** — the proof-strip numbers. Nothing on the site currently makes a numeric experience claim or names a stack. Inventing one would put a fabricated claim on a live commercial site.
- **Task 8 Step 1** — the spec amendment for the cyan eyebrow. Small, but it is a deliberate widening of the accent rule and should be visible as such.

**The one thing most likely to go wrong quietly:** `signal` spreading. Task 2's guard catches `bg-signal` and any mention inside `Button.tsx`, but it cannot catch `text-signal` used on a white background. If you add signal to any surface that is not navy, you have broken the direction — check the contrast before you do.

**The one thing most likely to go wrong loudly:** the OpenNext preview build (Task 10 Step 6). Run it before you believe the work is done; `next dev` succeeding proves very little on this stack.
