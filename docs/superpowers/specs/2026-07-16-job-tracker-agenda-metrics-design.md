# Job tracker: Agenda + Métricas

**Date:** 2026-07-16
**Status:** approved design, not yet implemented
**Scope:** `apps/platform` — two new student-facing views over the existing `job_applications` data, plus optional interview times.

## 1. Problem

The kanban board (`/vagas` · `/en/job-tracker`) tells a student *where each application stands*. It does not answer two questions students actually have:

1. **"What's coming up?"** Interview dates are stored per stage, but the board only renders the date matching a card's *current* stage. A student cannot see their week.
2. **"Where am I losing recruiters?"** A student with 24 applications and 1 offer has no way to see whether the problem is that nobody answers their first message, or that they fail technical interviews. Those two failures need completely different coaching.

## 2. Decisions

| Decision | Choice | Why |
|---|---|---|
| Audience | Each student, own data only | Fits existing RLS (`read own`) exactly. No admin access to personal job data — migration 0007 deliberately blocked that as LGPD-sensitive, and nothing here reopens it. |
| Interview times | Optional, nullable `time` columns | A calendar without an hour is half a calendar. Optional because students often know the day before the hour. |
| Calendar shape | Agenda list, upcoming first, past collapsed | Answers "what's next?" in one glance; trivially responsive at 375px; no grid navigation to build. A month grid can be added later over the same data layer. |
| Metrics content | Funnel + drop-off per stage; `no_return` grouped by stage | The two metrics that answer the question above. Source split and stale-follow-up lists were considered and dropped (YAGNI). |
| Navigation | Tabs inside the job tracker | Three lenses on one dataset, one entry in the Recursos dropdown. |
| Stage history | **Derive from the snapshot** (not an event log) | See §3. |

### 2.1 Why derive instead of logging stage events

An alternative design adds a `job_application_events` table writing (from, to, timestamp) on every move. Rejected for now:

- Neither chosen metric needs ordering or durations. Both are "did this application ever reach X" and "what stage was it in when contact died" — answerable from the current row.
- An event log **cannot backfill**. Existing applications have no history, so the metrics page would show near-empty until students accumulate months of new data. The derived version is useful the day it ships, on data students already entered.
- It is additive later. If time-in-stage ("you sit 12 days waiting on HR") becomes worth building, the event log can be added then without invalidating anything here.

**Accepted limitation:** derivation is a snapshot, not a history. If a student drags a card backward, or straight from first contact to offer, the intermediate stages count as "reached". For a personal funnel of self-entered data, this approximation is acceptable and will not be worked around.

## 3. Data model

### 3.1 Migration `0014_job_interview_times.sql`

```sql
alter table public.job_applications
  add column if not exists hr_interview_time time,
  add column if not exists tech_interview_time time,
  add column if not exists manager_interview_time time;
```

- Plain `time`, not `timestamptz`: a wall-clock "14:00" with no timezone conversion. Consistent with the board's deliberate `timeZone: "UTC"` date rendering, which exists so day-precision dates never shift a day for the viewer.
- No RLS change — the four existing policies are table-wide on `user_id`.
- No `first_contact_time` (first contact is not an interview) and no `offer_time` (an offer is not an event).
- Per §8 of CLAUDE.md, the same statements are appended to `supabase/setup-all.sql`.
- Per the standing Supabase authorization, the migration is applied to production **before** pushing code that reads the new columns.

### 3.2 `lib/job-tracker.ts` additions

```ts
/** The three stages that represent a scheduled meeting. */
export const INTERVIEW_STAGES = [
  "hr_interview",
  "tech_interview",
  "manager_interview",
] as const;

export type InterviewStage = (typeof INTERVIEW_STAGES)[number];

/** The time column each interview stage is about. Mirrors STAGE_DATE_FIELD. */
export const STAGE_TIME_FIELD = {
  hr_interview: "hr_interview_time",
  tech_interview: "tech_interview_time",
  manager_interview: "manager_interview_time",
} as const satisfies Record<InterviewStage, string>;

/** Every time column, for partial-update handling in the server actions. */
export const JOB_TIME_FIELDS = [
  "hr_interview_time",
  "tech_interview_time",
  "manager_interview_time",
] as const;
```

`lib/types.ts` — `JobApplication` gains the three nullable `string` time fields.

### 3.3 `lib/job-tracker-actions.ts`

A new `isoTime` schema alongside `isoDate`:

```ts
// <input type="time"> posts HH:MM or an empty string.
const isoTime = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{2}:\d{2}$/.test(v));
```

`parseDatePatch` is renamed `parseWhenPatch` and extended to loop `JOB_TIME_FIELDS` with `isoTime`, keeping the existing rule verbatim:

```ts
if (!formData.has(field)) continue;
```

**This guard is load-bearing.** The form renders only the date/time inputs for the card's current stage, so an edit posts a single date key and at most one time key. Patching only present keys is what stops a stage move from nulling the other stages' interview dates. A new time column that is not added to `JOB_TIME_FIELDS` will silently never save.

Postgres `time` accepts the `HH:MM` string directly; no formatting layer needed.

## 4. Routing and layout

### 4.1 `i18n/routing.ts`

```ts
"/job-tracker/agenda":  { "pt-BR": "/vagas/agenda",   en: "/job-tracker/agenda" },
"/job-tracker/metrics": { "pt-BR": "/vagas/metricas", en: "/job-tracker/metrics" },
```

The canonical internal href stays `/job-tracker/*`; `usePathname` from `@/i18n/navigation` returns the internal form, so all comparisons use it.

### 4.2 File layout

```
app/[locale]/job-tracker/
├── layout.tsx          NEW — shared title/subtitle + <JobTrackerTabs/>
├── page.tsx            existing board (title moves to layout)
├── agenda/page.tsx     NEW
└── metrics/page.tsx    NEW
```

Auth stays **per page**, not in the layout: layouts do not re-run on client navigation, and each page needs `getUserContext()` for its own query anyway. Middleware protects the routes as a first gate; the per-page `getUserContext()` → `redirect({href:"/login"})` check is the same defense-in-depth pattern the board already uses.

### 4.3 `components/job-tracker/JobTrackerTabs.tsx` (new, client)

Client only because it needs `usePathname` for active styling. Takes its three labels as props. Renders `Link` from `@/i18n/navigation` to `/job-tracker`, `/job-tracker/agenda`, `/job-tracker/metrics`. Active tab: `aria-current="page"` plus a navy underline; inactive: steel text.

### 4.4 Two existing equality checks to broaden

Both are one-liners, both would visibly break on the new sub-routes:

- `components/layout/HeaderNav.tsx` — `pathname === "/job-tracker"` swaps the Recursos dropdown for a "← Curso" back-link. On `/vagas/agenda` the check fails and the dropdown reappears mid-feature. → `pathname.startsWith("/job-tracker")`.
- `components/layout/ResourcesMenu.tsx` — same equality check drives active styling. → same fix.

## 5. Board changes

`components/job-tracker/JobTrackerBoard.tsx`:

- `ApplicationFields` renders an optional `<input type="time">` beside the existing date input, **only when the current stage is in `INTERVIEW_STAGES`** (`first_contact` has a date but no time; `offer` has neither).
- The card displays `17/07 · 14:00` when a time exists, falling back to the date alone when it does not.
- `app/[locale]/job-tracker/page.tsx` — the explicit `select(...)` column list must be extended with the three time columns, and `JobTrackerLabels` / the `labels` object gain `fields.interviewTime`.

The board keeps its existing `labels`-prop pattern (the layout's `NextIntlClientProvider` ships only the `common` namespace). The two new pages avoid that pattern entirely — see §6.

## 6. Agenda page

Server Component. No client JS.

**Query:** `id, company_name, contact_name, website_url, stage, status` + the three interview date/time pairs, `.eq("user_id", ctx.user.id)` on top of RLS.

**`lib/job-tracker-agenda.ts` (new, pure).** Flattens applications into events:

```ts
export type InterviewEvent = {
  applicationId: string;
  companyName: string;
  contactName: string | null;
  websiteUrl: string | null;
  stage: InterviewStage;
  date: string;          // YYYY-MM-DD
  time: string | null;   // HH:MM
  status: JobStatus;
};
```

For each application, for each stage in `INTERVIEW_STAGES` whose date column is non-null, emit one event. One application can therefore produce up to three events.

This is the point of the page: because the board only shows the *current* stage's date, an application now at "tech interview" visually hides the HR interview date the student typed weeks ago. The agenda surfaces every one.

**Rendering:**
- Upcoming events ascending (date, then time; timeless events sort first within their day, labelled "Dia todo" / "All day").
- Past events descending, inside a collapsed `<details>` — zero JS, keyboard-accessible for free.
- Grouped by day with a heading; today and tomorrow get relative labels ("Hoje" / "Amanhã").
- Each event shows stage, company, optional contact name, and a link to the board.
- Applications marked `no_return` still emit events, carrying the existing gray waiting-chip styling. Hiding them would silently swallow data the student typed; a future interview on a dead application is a contradiction the student should see and fix.
- Empty state: no interview dates anywhere → a message pointing at the board.

**The "today" boundary — decided:** the upcoming/past split and the Hoje/Amanhã labels are computed against **`America/Sao_Paulo`**, for both locales, via `Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })` to get today's `YYYY-MM-DD` for string comparison. The Workers runtime is UTC, so without this a Brazilian student checking at 22:00 would see tomorrow's interview labelled "Hoje". The audience is Brazilian; EN exists for international reach rather than a different timezone cohort. The rejected alternative — splitting client-side on browser-local time — is correct everywhere but forces the page to be a Client Component. Revisit if international students report it.

## 7. Métricas page

Server Component. No client JS, no chart library — CSS-width bars, which sidesteps the CSP entirely and matches the monochrome palette.

**Query:** `stage, status` + all four date columns, `.eq("user_id", ctx.user.id)`.

**`lib/job-tracker-metrics.ts` (new, pure).**

```ts
/** An application reached a stage if it is at or past it, or if that stage's
 *  date is filled. `offer` has no date column, so it falls back to the index. */
export function hasReached(app: JobApplication, stage: JobStage): boolean;

/** Per stage: how many reached it, and the conversion from the stage before. */
export function buildFunnel(apps: JobApplication[]): FunnelStep[];

/** The steepest conversion drop, or null when there is not enough data. */
export function biggestDropOff(funnel: FunnelStep[]): FunnelStep | null;

/** no_return applications counted by the stage they died at. */
export function lostContactByStage(apps: JobApplication[]): LostContactRow[];
```

`hasReached` implements the §2.1 derivation:

```
stageIndex(app.stage) >= stageIndex(target)
  || (target !== "offer" && app[STAGE_DATE_FIELD[target]] != null)
```

The `target !== "offer"` narrowing is required, not cosmetic: `STAGE_DATE_FIELD` is typed `Record<Exclude<JobStage, "offer">, string>`, so indexing it with an unnarrowed `JobStage` does not typecheck. The board and the edit form already narrow the same way.

`biggestDropOff` returns the step with the lowest conversion, skipping steps whose predecessor count is 0 (an undefined ratio, not a 0% one).

**Sections:**

1. **Seu funil** — the five stages with reached-counts, a bar, and the conversion from the previous stage. Beneath, a prose callout naming the weakest transition: *"Seu maior gargalo: primeiro contato → RH. Só 38% dos contatos viram entrevista."* The callout is the actual product — a student reading five percentages has to do the comparison themselves; naming the weakest step does it for them.
2. **Onde você perde contato** — `no_return` applications grouped by their current stage, as counts and percentages of the `no_return` total.

**Honesty guards:**
- Fewer than 10 applications → a caveat line above the funnel ("Poucos dados ainda; as porcentagens ficam mais confiáveis a partir de ~10 candidaturas"). Presenting 1-of-3 as "33%" invites a student to act on noise.
- Zero applications → both sections collapse to an empty state pointing at the board.
- Zero `no_return` applications → section 2 renders a positive empty state, not an empty chart.

**Color:** all bars navy on an off-white track. Red (`red-600`) is used only for the prose bottleneck callout. CLAUDE.md permits red for negative status, but a wall of red bars reads as alarm rather than information, and "you lose most contacts at step 1" is diagnostic, not a failure.

## 8. Testing

`lib/job-tracker-metrics.ts` and `lib/job-tracker-agenda.ts` are pure functions over plain arrays — no I/O, no Supabase, no React. They get real vitest coverage, which is the first logic test in `apps/platform` (open item #6; CLAUDE.md §10 asks for logic tests when touching logic). Funnel math is precisely the thing to test rather than eyeball.

Cases to cover:

- `hasReached` — at the stage; past the stage; before it but with the date filled; before it with no date; `offer` (no date column).
- `buildFunnel` — empty input; single application; an application that skipped intermediate stages; a `no_return` application still counting as having reached its stage.
- `biggestDropOff` — normal case; a tie; a zero-predecessor step skipped; all-zero input returning null.
- `lostContactByStage` — no `no_return` rows; all at one stage; spread across stages; percentages summing to 100.
- Agenda flattening — an application with all three dates emitting three events; none emitting zero; timeless events; sort order across days and within a day; the upcoming/past split at the São Paulo boundary (inject "today" as a parameter so this is deterministic rather than clock-dependent).

The agenda's upcoming/past split takes today's `YYYY-MM-DD` as an **explicit parameter** rather than calling `new Date()` internally, so tests are deterministic and the São Paulo boundary is resolved once, at the page. The metrics functions have no clock dependency at all — the funnel counts reached-stages, never durations.

## 9. i18n

New keys under the `jobTracker` namespace in **both** `messages/pt-BR.json` and `messages/en.json`, same commit — the parity test fails on drift or empty strings.

- `jobTracker.tabs.board` / `.agenda` / `.metrics`
- `jobTracker.agenda.*` — title, subtitle, empty state, "Dia todo", "Hoje", "Amanhã", past-section summary (with a count placeholder)
- `jobTracker.metrics.*` — title, subtitle, funnel heading, lost-contact heading, bottleneck callout (with stage placeholders and a percentage), low-data caveat, empty states
- `jobTracker.fields.interviewTime`

Existing `stages.*` labels are reused. Note the existing convention: message keys are camelCase (`stages.firstContact`) while DB values are snake_case (`first_contact`), mapped explicitly key-by-key in `page.tsx` — the new pages follow the same explicit mapping.

The two new pages use `getTranslations` server-side and therefore need **no** `labels` prop — the board's hand-passing pattern exists only because it is a Client Component.

## 10. Files touched

**New:**
- `supabase/migrations/0014_job_interview_times.sql`
- `app/[locale]/job-tracker/layout.tsx`
- `app/[locale]/job-tracker/agenda/page.tsx`
- `app/[locale]/job-tracker/metrics/page.tsx`
- `components/job-tracker/JobTrackerTabs.tsx`
- `lib/job-tracker-agenda.ts` + `lib/job-tracker-agenda.test.ts`
- `lib/job-tracker-metrics.ts` + `lib/job-tracker-metrics.test.ts`

**Modified:**
- `supabase/setup-all.sql` — append 0014
- `i18n/routing.ts` — two pathnames
- `lib/job-tracker.ts` — `INTERVIEW_STAGES`, `STAGE_TIME_FIELD`, `JOB_TIME_FIELDS`
- `lib/types.ts` — three time fields on `JobApplication`
- `lib/job-tracker-actions.ts` — `isoTime`, `parseWhenPatch`
- `components/job-tracker/JobTrackerBoard.tsx` — time input + card display
- `components/layout/HeaderNav.tsx` — `startsWith`
- `components/layout/ResourcesMenu.tsx` — `startsWith`
- `app/[locale]/job-tracker/page.tsx` — `select(...)`, labels, title moves to layout
- `messages/pt-BR.json`, `messages/en.json`
- `CLAUDE.md` — §2 and §4 site map

## 11. Suggested build order

Each stage is independently shippable and verifiable:

1. Migration 0014 + `lib/job-tracker.ts` constants + `types.ts` + actions + board time input. *(Board works with times; nothing else visible.)*
2. Layout + tabs + the two `startsWith` fixes, with agenda/metrics as stub pages. *(Navigation works.)*
3. `lib/job-tracker-agenda.ts` + tests + the agenda page.
4. `lib/job-tracker-metrics.ts` + tests + the metrics page.
5. `CLAUDE.md` update.

## 12. Explicitly out of scope

- Month-grid calendar view (agenda list first; add only if students ask).
- `job_application_events` stage-history log, and any time-in-stage metric (§2.1).
- Admin/mentor cross-student views and cohort benchmarks (LGPD; migration 0007's deliberate block stands).
- Source (active/passive) conversion split and stale-follow-up nudges — considered, dropped as YAGNI.
- Calendar export (.ics), notifications, reminders.
- A "próximas entrevistas" block on the student dashboard.
