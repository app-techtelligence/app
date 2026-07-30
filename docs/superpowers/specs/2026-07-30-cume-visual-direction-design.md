# Direção visual "Cume" — topografia como sistema

**Date:** 2026-07-30
**Status:** approved design, not yet implemented
**Scope:** `apps/web` — new visual direction for the marketing site. Phase 1 lands it on Home + `/styleguide` only; the other eight page types keep their current look until Phase 2.
**Supersedes:** the uncommitted work on `feature/ui-redesign` (kept in part — see §8).

## 1. Problem

The marketing site is live and technically healthy, but three things are wrong with how it looks. The user named all three:

1. **Generic — reads as a template.** All five product pages run the identical recipe: navy-gradient hero → mid sections → `TalentBridge` → `FinalCta`. Every hero is the same gradient with the same logo watermark. The only variation across the whole site is background alternation (`bg-white` ↔ `bg-canvas` ↔ `bg-navy`). Nothing carries personality except the background color.
2. **No authority.** A B2B consultancy buyer sees zero concrete proof above the fold — no numbers, no stack, no architecture. The site is 100% typography with no imagery at all beyond grayscale client logos. That reads closer to an infoproduct than to senior consulting.
3. **Too monochrome.** One typeface (Manrope) for everything, and no accent color since amber was removed on 2026-07-13. Hierarchy is flat because there is no device left to create it.

All three share one root cause: **there is no element on the site that carries identity.** Fixing the palette alone, or the type alone, would not close any of them.

## 2. Decisions

| Decision | Choice | Why |
|---|---|---|
| Direction | "Cume" — the mountain rendered as a topographic data field | The logo is a peak; a contour map is simultaneously that peak, an altitude/growth metaphor, and a data visualization. The effect stops being decoration and becomes an argument about what the company does. |
| Accent color | Add exactly one: `signal` `#5AC8E0` | Answers "too monochrome" with the minimum possible addition. See §3 for the rule that keeps it from becoming noise. |
| Accent scope | Only on navy surfaces, only as light | Not a style preference — `signal` on white is 1.95:1 and illegible. Restricting it is what makes it safe. |
| Display typeface | Archivo Expanded (`wdth` 122, weight 800) | Horizontal weight reads as engineering and signage rather than startup. Archivo at expanded width is rare; the normal width is the common default. |
| Data typeface | IBM Plex Mono (400/600), small text only | Carries IBM engineering-documentation heritage — the exact authority association the site lacks. |
| Body typeface | Manrope, unchanged | Already loaded, already correct for body and UI. No reason to churn it. |
| Signature element | Animated triangular contour field, Home hero only | Spending it on all five heroes would replace one uniform treatment with another and destroy the signature. |
| Shader implementation | Raw WebGL, zero dependencies | The effect is one fullscreen fragment shader. three.js (~150 KB gzipped) would be carried for a camera, scene graph and mesh abstraction that this never uses. |
| Geometry | **Single equilateral triangle**, not a 3-peak range | User decision after seeing both rendered live. The single triangle matches the logo mark more directly. |
| `framer-motion` | Remove | It entered the branch to animate one dropdown that was previously zero-cost CSS. ~50 KB gzipped on a static site targeting Lighthouse ≥ 90, for an animation CSS delivers identically. Reverting also returns `Header.tsx` to a Server Component — the committed dropdown opens on `:hover` and `:focus-within`, so it never needed client JS. The branch's `h-20` and `gap-8` spacing stay. |
| Button radius | `rounded-lg` (reverting the branch's `rounded-full`) | Pills read friendly/consumer; Archivo Expanded + Plex Mono + contour lines read precise/technical. The pill was at odds with the direction. |
| Authority device | Mono proof strip directly under the hero | The unmet need is density and proof, and no visual effect supplies it. Concrete numbers and stack names do. |

### 2.1 Why the accent rule is a rule, not a guideline

Measured contrast, sRGB:

| Pair | Ratio | Verdict |
|---|---|---|
| `signal` `#5AC8E0` on `navy` `#1A2A44` | **7.4:1** | AA for normal text, AAA for large |
| `signal` `#5AC8E0` on `white` | **1.95:1** | Fails every threshold |

So "accent only on navy" costs nothing and forecloses the failure mode. It also prevents the accent from spreading onto buttons and links until it becomes the generic cyan-on-navy SaaS look — which is the single biggest aesthetic risk in this direction and the reason the rule is written down here rather than left to judgment.

## 3. Color system

Tokens are added to the `@theme` block in **both** `apps/web/app/globals.css` and `apps/platform/app/globals.css`, per the existing convention that the two files change together. The platform will not use `signal` in Phase 1; defining it in both prevents drift.

| Token | Value | Role | Status |
|---|---|---|---|
| `navy` | `#1A2A44` | Headings, body, dark surfaces, filled buttons | unchanged |
| `navy-deep` | `#111B2E` | Depth, gradient base | unchanged |
| `steel` | `#667080` | Muted text on light (AA) | unchanged |
| `steel-light` | `#9AA3B0` | Muted text on navy (AA) | unchanged |
| `canvas` | `#F7F8FA` | Off-white backgrounds | unchanged |
| **`signal`** | **`#5AC8E0`** | Contour glow, active state on navy, focus ring on navy | **new** |

`signal` has exactly four permitted uses:

1. **Contour glow** — the hero gradient runs `navy` → `signal`, with only the crest approaching white.
2. **Active state on navy** — current nav item, current step, selected tab.
3. **Focus ring on navy** — today `:focus-visible` is `steel` everywhere, which nearly disappears against navy.
4. **Eyebrow / kicker on navy** — the small mono label above a heading, on dark surfaces only. This was in the approved prototype and is the accent's most visible moment; it is listed explicitly so it stays a decision rather than a drift.

Unchanged: emphasis stays fill-vs-outline, never hue. Primary buttons remain filled navy on light and filled white on dark. Semantic red stays the only non-palette color, destructive meaning only. The legacy `accent*` aliases stay mapped onto navy/steel and stay off-limits in new code.

## 4. Typography

Three families, loaded via `next/font/google`, subsets `["latin", "latin-ext"]` (Portuguese needs `latin-ext`).

| Role | Family | Config |
|---|---|---|
| Display (h1, h2) | Archivo | variable, `axes: ["wdth"]`, used at `font-variation-settings: 'wdth' 122`, weight 800 |
| Body + UI | Manrope | unchanged |
| Data, labels, eyebrows | IBM Plex Mono | weights 400 and 600, small sizes only |

**Accepted constraint:** Archivo Expanded consumes significantly more horizontal space than Manrope. Portuguese headlines must be written shorter than the current ones — this is a copy constraint, not only a CSS one, and applies to both locales in the same commit.

**Performance fallback, pre-committed:** three families is real weight on a site budgeted at Lighthouse ≥ 90 mobile. If Home drops below 90 after the fonts land, IBM Plex Mono is the one to cut — replaced by a system mono stack (`ui-monospace, SFMono-Regular, Menlo, monospace`). Archivo and Manrope are load-bearing for the direction; Plex Mono is a refinement.

## 5. The signature: triangular contour field

A client component rendering one fullscreen fragment shader to a `<canvas>` via raw WebGL. No npm dependency is added.

The entire geometry change from the source material is the distance function. The original used `length(uv)` — Euclidean distance from center, which is why it produced circles. Replacing it with a triangle SDF produces triangular contours and nothing else changes:

```glsl
float sdTri(vec2 p, float r) {
  float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
```

Color is remapped from the source's per-channel phase offset (which produced RGB fringing) to a single intensity mapped through `navy` → `signal` → white, so the field obeys §3.

**Required behaviors, all validated in the prototype:**

| Concern | Handling |
|---|---|
| Device pixel ratio | Clamped to 1.5. Unclamped on a DPR-3 phone renders 9× the pixels through a per-pixel loop with five divisions. |
| `prefers-reduced-motion` | Animation freezes on a composed frame. The image stays; only motion stops. |
| Offscreen | `IntersectionObserver` pauses the `requestAnimationFrame` loop when the hero leaves the viewport. |
| Geometry cost | One oversized triangle covers the viewport, not two triangles forming a quad. |
| No WebGL support | Falls back to the current `bg-gradient-to-b from-navy to-navy-deep`. The hero must be fully readable with the canvas absent. |
| Server rendering | The canvas is presentational only. All hero text is server-rendered and never depends on the shader mounting. |

**Proof strip.** Directly beneath the hero copy, inside the same navy surface: a mono row of three concrete claims separated by a hairline rule. Structurally it is years of experience · named stack · a compliance or delivery guarantee. Strings are i18n keys like everything else. This is the element that answers "no authority"; the shader does not.

**The numbers are not the implementer's to invent.** The prototype showed "12+ anos" as a placeholder. Before this ships, the actual figures must come from the user. Only the stack line can be filled from what the repo already asserts (`lib/clients.ts`, the consulting page copy), and it inherits the existing framing that this is **team experience, not TechTelligence clients** — CLAUDE.md §3. If a real number is unavailable at build time, the slot is dropped rather than softened; a vague proof strip is worse than two items.

## 6. Section system

**The shader runs on Home only.** Other pages inherit the *geometry*, not the animation: static SVG contour bands derived from the same triangle SDF, at lower intensity — zero JavaScript, zero runtime cost. Same visual language, different volume.

`TriangleDivider` is retired and replaced by those contour bands, so hero, dividers and section backgrounds stop being three unrelated vocabularies.

**Section order stops being identical across pages.** Today Consulting, Course and Mentorship all open Hero → cards → timeline → `TalentBridge` → `FinalCta`. Under the new direction each opens on its own premise: Consulting on proof and architecture, Course on destination, Mentorship on obstacle. This is Phase 2 work; it is recorded here because it is the structural half of the "generic" fix and must not be lost.

**Kept from the current branch:** `Card.tsx` (`rounded-2xl`, hover elevation) and the added breathing room (`py-20/24`, `gap-8`, header `h-20`). Both are consistent with the direction.

## 7. Component inventory

| Unit | Kind | Responsibility | Depends on |
|---|---|---|---|
| `ContourField.tsx` | Client | Mounts the canvas, owns the rAF loop, DPR clamp, reduced-motion and IntersectionObserver | `contour-shader.ts` |
| `contour-shader.ts` | Module | GLSL source + WebGL setup/teardown. No React. | nothing |
| `ContourBand.tsx` | Server | Static SVG contour divider, `tone` prop | nothing |
| `ProofStrip.tsx` | Server | Mono proof row, i18n strings | `next-intl` |
| `Button.tsx` | — | `rounded-full` → `rounded-lg` | existing |
| `ServicesDropdown.tsx` | **deleted** | The CSS dropdown at `HEAD` moves back inline into `Header.tsx`; `framer-motion` removed | — |
| `globals.css` (both apps) | — | `signal` token; `:focus-visible` on navy | existing |

Keeping the GLSL and WebGL plumbing in `contour-shader.ts`, separate from the React component, means the shader can be changed without touching lifecycle code and vice versa.

## 8. Branch hygiene

Four problems exist in the uncommitted `feature/ui-redesign` working tree and are fixed as part of this work:

| # | Problem | Fix |
|---|---|---|
| 1 | `docs/style-guide.md` contains `[cite: 1]` markers on nearly every line and lost 147 lines (48 added, 147 removed) — pasted from an LLM chat export | Restore from `HEAD`, then rewrite deliberately to incorporate this direction |
| 2 | `package-lock.json` at root, and `framer-motion` + `lucide-react` in root `dependencies` — npm was run inside a pnpm workspace | Delete the lockfile. Root `package.json` goes back to `turbo` in `devDependencies` and **no** `dependencies` block. Drop `framer-motion` from `apps/web/package.json` too (the dropdown reverts to CSS). `lucide-react` is imported nowhere in the repo — verified — so it is removed outright, not relocated. Re-run `pnpm install`; `nodeLinker: hoisted` must stay intact (CLAUDE.md §8) |
| 3 | `images/` holds ~55 MB of untracked PNGs (blog covers 5–8 MB each, banners, `files.zip`, a founder photo) and is not gitignored | Add `images/` to `.gitignore`. R2 is already the source of truth for covers |
| 4 | `/styleguide` page exists but is absent from `apps/web/i18n/routing.ts` | Register the pathname. It becomes the page where this direction is validated |

## 9. Scope

**Phase 1 (this spec):** design tokens, three typefaces, `ContourField`, `ContourBand`, `ProofStrip`, Home hero, `/styleguide` as the living registry, button radius revert, `framer-motion` removal, all four hygiene items.

**Phase 2 (separate spec, not now):** rolling the direction across `/consulting`, `/course`, `/mentorship`, `/about`, `/blog`, `/contact`, `/privacy`, plus the per-page section reordering described in §6.

**Explicitly out of scope:** the platform app's visuals, blog cover art direction (a deliberately separate system), photography of any kind (user decision, 2026-07-30), and `packages/` extraction.

## 10. Verification gates

Phase 1 is not done until all of these pass:

1. `pnpm lint`, `pnpm typecheck`, `pnpm test` green at root — including the message-parity test, since every new string ships in `pt-BR.json` and `en.json` in the same commit.
2. `pnpm --filter web preview` builds and serves through the OpenNext Cloudflare adapter. This is the gate that catches runtime incompatibility; `next build --webpack` and the `middleware.ts` filename must both stay as they are.
3. Lighthouse mobile ≥ 90 on Home. If fonts push it under, apply the §4 fallback.
4. Home is fully readable and correctly laid out with WebGL unavailable and with `prefers-reduced-motion: reduce` set.
5. Visible keyboard focus on every interactive element, on both navy and light surfaces.
6. 375px viewport check.
7. `git status` shows no `package-lock.json` and no `images/` — confirming §8 items 2 and 3 actually took.

## 11. Accepted limitations

- **The cyan risk is real and permanent.** Cyan-on-navy is common in technology consulting. The rule in §2.1 is what differentiates this from the default, and it will need enforcing in every future review. If `signal` ever appears as a button fill or a link color, the direction has failed.
- **A shader is not authority.** The contour field fixes "generic". If the proof strip and the Phase 2 density work do not ship, the site will look better and still read as an infoproduct. These are not independent deliverables.
- **One page proves less than a site.** Phase 1 validates the direction on Home. Pages with heavy explanatory content — Course especially — may resist the shorter-headline constraint that Archivo Expanded imposes. That will be discovered in Phase 2, and adjusting the type scale for those pages is an acceptable outcome.
