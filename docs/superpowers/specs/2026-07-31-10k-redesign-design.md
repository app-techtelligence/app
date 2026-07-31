# Redesign "$10K" — Ponto 01: direção com ponto de vista

**Date:** 2026-07-31
**Branch:** `feature/ui-redesign`
**Status:** Point 01 decided and approved by the owner. Points 02–08 audited, not yet worked.
**Scope:** `apps/web` — all 13 page types.
**Source of the goal:** *The $10K Checklist* (Metics Media, Field Guide No. 01) — eight criteria that separate a $10K website from a $200 one. The owner's goal, in their words: someone opening the site should think *"this must have cost at least ten thousand dollars."*

**Relationship to the prior spec:** this document **partially supersedes**
`2026-07-30-cume-visual-direction-design.md`. The *thesis* of that spec (topography as
system) survives and is hardened. Four of its decisions are reversed — see §9.

---

## 1. What is actually wrong today

Observed on the running branch, not inferred:

1. **The Home hero reads as a neon wallpaper, not as topography.** The WebGL contour field
   renders as bright cyan diagonal streaks. The subtitle and the proof line are illegible
   over it — `7+ years in data engineering and web development` disappears entirely. This is
   the single most clichéd look in the category: dark hero + cyan + WebGL.
2. **The interior of every page is the untouched template.** Centered eyebrow → centered h2 →
   centered subtitle → three white rounded cards. Three of the five main pages run a literally
   identical skeleton:

   ```
   Consultoria:  Hero → Services(3 cards) → Approach(01·02·03) → WhyUs → TalentBridge → ClientLogos → FinalCta
   Curso:        Hero → WhoItsFor         → Tracks(cards)      → Method(01·02·03)     → TalentBridge → FinalCta
   Mentoria:     Hero → HelpAreas(cards)  → Process(01·02·03)  → Credibility          → TalentBridge → FinalCta
   ```

3. **Phase 1 of "Cume" landed on Home and `/styleguide` only.** The other 12 page types kept
   the old look. The result is worse than uniform mediocrity: one impressive page bolted onto
   a template, and the visitor discovers it on the first click. Under the Point 01 criterion —
   *"executes it without flinching"* — shipping the direction on one page **is** the flinch.

4. **Scope was under-counted.** There are **13** page types, not 9: Home, Consultoria,
   `/consultoria/ia`, `/consultoria/governanca-de-dados`, Curso, Mentoria, Sobre, Blog listing,
   Blog post, Contato, Privacidade, `/styleguide`, 404.

---

## 2. The direction

> **The site stops being a dark landing page and becomes a topographic survey sheet.
> Paper by default, navy as ink. Instrument light becomes rare, and therefore means something.**

The root insight, and it was free: **the logo is a trig point** — the triangle that marks a
surveyed summit on a topographic map. It is not a metaphor invented for this redesign; it is
literally the cartographic symbol. Therefore the entire vocabulary of the sheet — contour
lines, index contours, spot heights, the margin with its metadata, the legend, the datum —
already belongs to this brand.

This answers Point 01 on all four axes it implies:

| The question Point 01 asks | The decision |
|---|---|
| What is the direction? | Topographic survey sheet: paper-dominant, navy ink, dark only where the instrument speaks |
| What is the signature? | The contour plate that plots itself on load |
| How does it become structure? | `Sheet` — an asymmetric margin grid, on all 13 page types |
| Where does it flinch? | Nowhere: one device per page, and the blog-cover collision resolved |

### 2.1 Why light, when the category is dark

Going paper-dominant is the deliberate aesthetic risk of this direction, and it is the reason
the site can read as expensive. Competitors in data/AI consulting go dark. An engineering
document reads more senior than a glowing landing page, and it makes the two remaining dark
surfaces land hard instead of being wallpaper. Keeping a navy gradient hero — even a
beautiful one — would be the recoil that Point 01 exists to catch.

### 2.2 The default-drift guardrails

A "paper document" direction can collapse into a generic broadsheet look — hairline rules
everywhere, zero radius, dense newspaper columns. Four rules prevent it, and they are rules
rather than taste:

1. **No serif anywhere.** Display stays Archivo Expanded (signage/engineering), body stays
   Manrope. This separates the direction from both the cream/serif/terracotta default and the
   broadsheet default.
2. **The lines are geodetic, not typographic.** They are contours generated from the triangle
   SDF, curved, at measured intervals, with index lines and elevation labels — not decorative
   hairline rules.
3. **Radius is kept** where already decided (`rounded-lg` buttons, `rounded-2xl` cards).
   Zero-radius is not what makes a design serious.
4. **Paper is cool, never warm.** This is drafting stock, not literary stock. Cream is
   off-limits.

---

## 3. Colour

Five values plus one restricted accent. **No new hue is introduced.** The answer to
"the site is too monochrome" is value structure, line density and type-scale contrast — not
a colour, which is also the more expensive-looking answer.

| Token | Value | Role | Status |
|---|---|---|---|
| `ink` (existing `navy`) | `#1A2A44` | all text, all lines, filled buttons | unchanged |
| `ink-deep` (existing `navy-deep`) | `#111B2E` | the two dark surfaces | unchanged |
| `graphite` (existing `steel`) | `#667080` | secondary text on paper (AA) | unchanged |
| **`paper`** | **`#EEF1F5`** | the site's default surface | **new — replaces `#F7F8FA` as dominant** |
| `sheet` | `#FFFFFF` | insets, cards, tables | unchanged |
| `signal` | `#5AC8E0` | dark surfaces only | unchanged rule, now rare |

`#EEF1F5` is cooler and deeper than the current `#F7F8FA` on purpose: `#F7F8FA` reads as
"nearly white", so white insets do not lift off it. `#EEF1F5` reads as a surface.

**The `signal` rule is unchanged and non-negotiable:** `signal` measures 7.4:1 on navy and
1.95:1 on white. It is permitted only on dark surfaces, only as light — contour glow, active
state, focus ring, mono eyebrow. Never a button fill, link colour or background. Because dark
surfaces drop to two per page under this direction, the accent becomes genuinely rare.

**Naming decision:** the tokens are *not* renamed in CSS. `navy`/`steel` stay as the token
names to avoid a 20-file rename with no user-visible benefit; `ink`/`graphite` are the words
used in design conversation. Only `paper` is added.

---

## 4. The signature: the plate plots itself

**WebGL is deleted.** For thin dark lines on a light surface it is the wrong instrument: it
shimmers, it produces moiré, and the cost is measured — the 702 ms of main-thread work that
holds Home at Lighthouse 79–88 is `ContourField` compiling its shader and running its rAF
loop. Paying that to draw hairlines is the worst available trade.

The triangle SDF mathematics survives. It migrates from a fragment shader into a pure module
that emits SVG `<path>` data on the server.

> **The plate draws itself on load.** Contours appear from the summit outward, staggered,
> ~1.2 s, once, via `stroke-dashoffset` in plain CSS.

This beats the shader on four counts, not one:

- it is an **orchestrated moment** rather than an ambient loop, and an ambient loop is exactly
  what makes a site read as a wallpaper pack;
- it is **true to the subject** — a survey sheet *is* plotted;
- it costs almost nothing at runtime, and it is server-rendered, crisp at any DPR, and prints;
- it survives `prefers-reduced-motion` by simply being born fully drawn.

**Three plate variants only** — `peak` (Home), `terrain`, `minimal`. Per-page meaning is
carried by **annotations**, not by bespoke generators. This is a deliberate cut from an
earlier seven-variant proposal: same visual payoff, a third of the art direction, and a more
coherent system, because every page becomes a crop of the same survey — which is literally
how a topographic map series works.

What makes the plate read as an instrument rather than as decoration, and where the money
becomes visible:

- **index contours** — every 5th line heavier, with its elevation set in mono along the line
- **spot heights** — a dot with a number pinned to a place
- **the trig point** — the logo triangle, appearing as a cartographic symbol, never as a
  watermark
- **leader lines** — a hairline from a feature out to a mono label in the margin

---

## 5. Structure: the margin grid

Every section runs on an asymmetric grid: a narrow margin column carrying mono metadata, and
a wide content column. This is how a technical drawing is read, and one component kills the
centred-marketing feel across all 13 page types at once.

```
┌───────────┬──────────────────────────────────────────┐
│ §03       │ Como trabalhamos                         │
│ MÉTODO    │                                          │
│           │ Sem projeto infinito: um caminho claro   │
│ ─────     │ da base ao cume.                         │
│           │                                          │
│           │ ┌───── diagnóstico ──── arquitetura ───┐ │
└───────────┴──────────────────────────────────────────┘
```

**Honesty rule:** the margin carries a **section reference**, never an invented altitude.
Elevation notation appears only where the content genuinely is an ascent — the Curso stages
and the Consultoria phases. Decoration pretending to be information is the failure mode this
rule exists to prevent.

Mobile behaviour is **not decided here.** It belongs to Point 07, which the audit in §11 marks
as the largest piece of open design work. The margin grid must not be collapsed by simply
stacking; it needs its own phone design.

---

## 6. One device per page

Each instrument of the survey sheet is used exactly once across the site, so no two pages
share a structural device.

| Page | Plate | Interior device | Why it is true |
|---|---|---|---|
| Home | `peak` (the only animated plate on the site) | **legend** — the three product doors are the three entries in this map's legend | a legend explains what the symbols mean; that is precisely Home's job |
| Consultoria | `terrain` | **elevation zones** — diagnóstico ⟶ arquitetura ⟶ operação as bands of depth | consulting really is staged by depth, not by time |
| Curso | `terrain` + route annotations | **route profile** — a cross-section with the stages marked on the climb | a career transition is literally an ascent with stages; the strongest of the six |
| Mentoria | `terrain` + pass annotations | **obstacle + contour** — name the blocker, then the route past it | mentorship exists because of one specific blocker |
| Sobre | `terrain` + datum annotation | **benchmark + spot height** — the survey's origin point | the founder story is the reference point |
| Blog listing | `minimal` | **sheet index** — an index of plates is exactly a list of posts | |
| `/consultoria/ia`, `/consultoria/governanca-de-dados` | `terrain`, lower intensity | inherit Consultoria's zones | they are crops of it |
| Contato, Privacidade | `minimal`, margin only | **none** — an excellent form and an excellent document on paper | restraint; metaphor here would be ornament |
| Blog post | `minimal` | article layout in the Sheet grid | |
| `/styleguide` | `minimal` | the living registry of the direction | |
| 404 | `minimal` | "off the sheet", one line | |

### 6.1 Two consolidations

**The closing block collapses.** `TalentBridge` + `ClientLogos` + `FinalCta` currently stack
three near-identical navy bands at the end of every page. They become **one** instrument block
per page: concrete proof and the CTA on the same dark surface. That surface plus the footer
are the only dark surfaces on the page.

**`TalentBridge` on Consultoria becomes marginalia** — a mono note in the sheet margin, not a
band. This solves two problems at once: it removes the repetition, and it fits CLAUDE.md §3's
requirement that the talent-bridge promise stay deliberately non-promissory. A margin note
*is* an aside and admits it. On Curso and Mentoria it stays a block, because there it is the
payoff rather than the aside.

### 6.2 Header and footer

The header becomes a **sheet header**: navigation in mono, uppercase, tight tracking, quiet.
The logo triangle is already the trig point and needs no further treatment. The footer is the
second dark surface and acts as the sheet's **legend and datum**. The existing curtain-footer
behaviour is kept — it is genuinely distinctive and costs nothing.

---

## 7. The instrument block

The element that answers "are these people senior?" — and no visual effect supplies it. It
requires fact.

Facts supplied by the owner on 2026-07-31, framed as **team experience, not TechTelligence
clients**, per the mandatory convention in CLAUDE.md §3 that already protects the client-logo
wall:

```
EXPERIÊNCIA DA EQUIPE
────────────────────────────────────────
EM PRODUÇÃO        7 anos
PLATAFORMAS        Databricks · Snowflake
STREAMING          Kafka
NUVENS             AWS · Azure · GCP
────────────────────────────────────────
```

A specification table in mono. It convinces *because* it is dull and specific — the opposite
of "end-to-end innovative solutions".

**Curso and Mentoria carry no numbers.** There is no real curriculum yet (CLAUDE.md §13.2) and
no placed student, so a number there would be either empty or false. Their closing block
carries **concrete commitment** instead: what the student receives, what each stage produces,
what the mentorship covers. That is verifiable and specific without a track record. Market
proof lives on the consulting side and reaches the B2C pages through the talent bridge.
Owner-approved on 2026-07-31.

Rule inherited from the prior spec and still binding: if a real figure is unavailable, the
slot is **dropped**, never softened. A vague readout costs more than no readout.

---

## 8. Motion policy

One decision, not six.

| | |
|---|---|
| **Kept** | the plate plotting (once, on load) · the existing curtain-footer · hover on links and cards (CSS) |
| **Removed** | `data-reveal` on every section — a scattered effect, and scattered effects are what make a site read as generated |
| **Never** | ambient loops, parallax, animated counters, numbers that tick up |

Micro-interaction detail (hover, focus, press) is **not decided here** — it belongs to
Point 06.

---

## 9. What is born and what dies

**Born**

| Unit | Kind | Responsibility |
|---|---|---|
| `lib/contour-plate.ts` | pure module | triangle SDF → contour polylines + feature anchors. No React, no DOM, unit-testable. Inherits the place of `contour-shader.ts` |
| `components/plate/ContourPlate.tsx` | Server | emits the SVG. `variant`: `peak` · `terrain` · `minimal`; plus annotations |
| `components/layout/Sheet.tsx` | Server | the margin grid. `index`, `label`, optional `note`. The component that kills the centred layout on 13 pages |
| `components/ui/InstrumentBlock.tsx` | Server | dark readout panel: label/value rows plus a CTA slot. Absorbs `ProofStrip` |
| `components/ui/MarginNote.tsx` | Server | marginalia (Consultoria's `TalentBridge`) |

**Dies** — this is committed work being removed, deliberately:

- `components/sections/home/ContourField.tsx`, `lib/contour-shader.ts`,
  `lib/contour-shader.test.ts` — the WebGL implementation. **Reverses prior spec §2 and §5.**
- `components/sections/home/ProofStrip.tsx` — absorbed into `InstrumentBlock`
- `components/layout/RevealObserver.tsx`, `lib/reveal.ts`, `lib/reveal-bootstrap.ts`,
  `lib/reveal.test.ts` — the blanket section reveal, **including the five tuning commits
  `87b3e1d` → `7c3989b`**. The plate's plot animation is CSS-on-load and needs no observer.
  The curtain-footer does not depend on this and stays.
- `--text-shadow-halo` / `--text-shadow-halo-sm` in `globals.css` — they exist only because
  white text sat over a neon shader. On paper, contrast is contrast.
- the `LogoMark` watermark in every hero — the cheapest device on the site

**Reversed from the prior spec, explicitly:** (1) WebGL shader → server-rendered SVG;
(2) the dark navy hero, including on Home → paper; (3) `signal` as the hero's dominant
treatment → `signal` as a rare instrument accent; (4) `ProofStrip` as a standalone strip →
absorbed into the closing instrument block.

---

## 10. Typography — provisional, owned by Point 02

Recorded here because the direction is load-bearing on it, but **not yet ratified**. Point 02
of the checklist owns this and must confirm or overturn it.

Families are unchanged and already loaded: **Archivo** variable at `wdth` 122 weight 800
(display), **Manrope** (body/UI), **IBM Plex Mono** 400/600 (data, labels, margin). None of
them is Inter or Roboto, which Point 02 requires.

| Role | Face | Size |
|---|---|---|
| Display XL — Home h1 | Archivo Expanded 800 | `clamp(2.75rem, 7vw, 5.5rem)`, leading 0.95, tracking −0.02em |
| Display L — page h1 | Archivo Expanded 800 | `clamp(2.25rem, 5vw, 3.75rem)` |
| Display M — h2 | Archivo Expanded 800 | `clamp(1.75rem, 3vw, 2.5rem)` |
| Lead | Manrope 400 | 20px / 1.55 |
| Body | Manrope 400 | 17px / 1.65, measure 64ch |
| Margin · label | IBM Plex Mono 500 | 11px, uppercase, tracking 0.18em |
| Data · table | IBM Plex Mono 400 | 13px, `tabular-nums` |

The contrast between 88px of Archivo Expanded and 11px of mono **is** the design. Without that
jump, paper is merely a light site.

**Accepted cost, and it is not a footnote:** Archivo Expanded at 88px requires headlines of
roughly 4–6 words. The current Home h1 — *"Tecnologia que transforma empresas e carreiras"* /
*"Technology that transforms companies and careers"* — does not fit. **Rewriting the h1 of all
13 pages plus the section h2s, in pt-BR and en in the same commit, is part of this work.** The
message-parity test fails otherwise.

---

## 11. Audit of the remaining seven points

Checked against the code on 2026-07-31.

| # | Point | Status | What remains |
|---|---|---|---|
| 01 | Point of view, not a template | **decided** | execution only |
| 02 | Typography that does work | nearly | families and scale drafted (§10); rewrite 13 headlines so they "feel chosen" |
| 03 | A restrained colour system | nearly | five values fixed (§3). **Finding: the legacy `accent` / `accent-strong` / `accent-ink` aliases appear in 20 files, 29 occurrences, and are the dominant way colour is applied today** — despite CLAUDE.md declaring them legacy. They must die |
| 04 | Hierarchy that breathes | **open** | the type scale exists; **a spacing scale does not** — spacing today is ad-hoc `py-20` / `gap-8`. Whitespace is half of this point and nobody has decided it |
| 05 | Imagery with intent | nearly | **Finding: only 3 files in the whole site touch an image** (`ClientLogos`, `PostCard`, `PostBody`); there is not one stock photo. The generated plates are the art-directed assets. Blog covers resolved (§12). Remaining: the founder photo on Sobre, a placeholder since inception (CLAUDE.md §13.1) |
| 06 | Motion that whispers | nearly | macro policy decided (§8); micro-interactions — hover, focus, press — not designed |
| 07 | Mobile that's designed, not shrunk | **untouched** | exists only as a 375px verification gate. The margin grid needs its own phone design. The checklist marks this as where 90% of cheap sites collapse |
| 08 | The invisible expensive stuff | nearly | metadata, hreflang, sitemap, security headers, `:focus-visible` and semantic HTML already exist. Remaining: measure sub-2s load and Lighthouse once the shader is gone |

Points 04 and 07 are where real design work remains. 02, 03, 05 and 06 need ratifying rather
than inventing. 08 is measurement.

---

## 12. Blog covers

The five published posts carry navy + amber AI-generated editorial illustrations — a
deliberately separate system (CLAUDE.md §5.1) that also serves as each post's `og:image`.

On a cool, strictly monochrome paper site, that amber would be the loudest thing anywhere on
the site, contradicting the "no accent colour" rule on the very page meant to read as a
serious publication. Incoherence is what makes a site look cheap.

**Decision: duotone on site, full colour on social.** A CSS filter renders covers as navy
duotone over paper inside the site; the R2 object stays untouched and full colour, so
LinkedIn, Facebook and X keep receiving the colourful image where colour helps click-through.
Cost: one CSS rule. The art direction of future covers does not change.

---

## 13. Phasing

- **Phase A — Foundation.** `paper` token, type scale utilities, `Sheet`, `ContourPlate` +
  `lib/contour-plate.ts`, `InstrumentBlock`, `MarginNote`; deletion of the WebGL, the reveal
  system, the halo shadows and the hero watermark; `/styleguide` rebuilt as the living
  registry of the direction.
- **Phase B — The doors.** Home, Consultoria, Curso, Mentoria.
- **Phase C — The rest.** The two service sub-pages, Sobre, Blog listing, Blog post, Contato,
  Privacidade, 404.

Each phase closes green on the gates in §14 before the next begins.

---

## 14. Verification gates

1. `pnpm lint`, `pnpm typecheck`, `pnpm test` green at root — including the message-parity
   test, since every rewritten headline ships in `pt-BR.json` and `en.json` in the same commit.
2. `pnpm --filter web preview` builds and serves through the OpenNext Cloudflare adapter.
   `next build --webpack` and the `middleware.ts` filename stay as they are (CLAUDE.md §8).
3. **Lighthouse mobile ≥ 90 on Home** — now reachable, since the measured cause of the 79–88
   score was the shader.
4. Visible keyboard focus on paper and on both dark surfaces.
5. 375px viewport check on every page type.
6. `prefers-reduced-motion: reduce` — the plate renders fully drawn, nothing animates.
7. Printing the privacy policy still produces pages.
8. `git status` clean: no `package-lock.json`, no `images/`.

---

## 15. Accepted limitations

- **Paper is the risk.** Inverting a live B2B site away from the category's default dark look
  is the deliberate bet of this direction. If it fails, it will fail by looking under-designed
  rather than clichéd — which is why §2.2's guardrails and §10's type contrast are
  load-bearing, not stylistic.
- **A plate is not authority.** The contour system fixes "generic". If the instrument block
  and the headline rewrite do not ship, the site will look better and still read as an
  infoproduct. These are not independent deliverables.
- **The B2C pages have no proof and will not fake one.** Curso and Mentoria are carried by
  commitment and by the consulting side's credibility. That is a real ceiling on how
  authoritative those two pages can read until there is a curriculum and a placed student.
- **Deleting the reveal discards five commits of tuning.** Owner-approved on 2026-07-31,
  recorded here so it is not later mistaken for an accident.
- **13 page types is a large surface.** Phase C is the most likely place for the direction to
  degrade under fatigue. `/styleguide` exists as the registry precisely to make drift visible.
