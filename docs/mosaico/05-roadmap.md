# Mosaico — roadmap, risks, open questions

Capacity is **10–20 h/week** (D13), which is what the estimates below were sized for, so
they stand as written. Each milestone has acceptance criteria: a milestone is not done
because the code exists, it is done when the criteria are demonstrably met.

| Milestone | Size | Cumulative | Indicative finish |
|---|---|---|---|
| M1 Spike | 1–2 wk | 1–2 wk | late Sep 2026 |
| M2 Daemon | 3–4 wk | 4–6 wk | late Oct 2026 |
| M3 App, tiling | 4–6 wk | 8–12 wk | early Dec 2026 |
| M4 Canvas | 4–6 wk | 12–18 wk | mid Jan 2027 |
| M5 Power features | 3–4 wk | 15–22 wk | mid Feb 2027 |
| M6 Linux + 0.1.0 | 2–3 wk | 17–25 wk | early Mar 2027 |

That is 17–25 weeks of *work*, not of calendar. It assumes no gaps, and there will be gaps
— consultancy load, the website, December. **Plan on 0.1.0 landing somewhere between March
and May 2027**, and treat any date inside that range as good.

The dates are a planning aid, not a commitment to anyone. The only hard gate is M1: if the
spike fails, everything after it is re-estimated from the fallback that replaces it.

---

## M0 — Specification ✅

These documents. Done 2026-09-12.

## M1 — Spike: prove the stack (~1–2 weeks)

**The most important milestone.** D2 chose Tauri, which means WebView2 on Windows, and
WebView2's graphics performance is the assumption the entire design rests on. M1 exists to
find out whether that assumption holds **before** anything is built on top of it.

Build the smallest honest thing: one window, one real shell, xterm.js, plus a throwaway
harness that fakes 20 panes on a zoomable board.

**Acceptance criteria — all measured on real Windows hardware, not estimated:**

| Criterion | Target |
|---|---|
| Keypress → glyph on screen | p99 < 20 ms |
| `cat` of a 50 MB file | Completes without stalling the UI or growing memory without bound |
| 20 panes on a board, 3 streaming output | ≥ 45 fps while panning and zooming |
| Simultaneous WebGL contexts before failure | Measured and written down |
| PT-BR keyboard: dead keys (`á ã ç`) and AltGr | Correct |
| IME composition | No partial input leaks to the PTY |
| Mixed-DPI multi-monitor | Cell metrics survive moving the window |

**Deliverable:** a written go/no-go with the numbers, and if no-go, a decision from the
fallback ladder below. Nothing after M1 starts until this is answered.

## M2 — Daemon core (~3–4 weeks)

`mosaico-proto`, `mosaico-core`, `mosaico-daemon`, `mosaico-cli`. No GUI at all.

Sessions, PTY on Windows and Linux, VT parser, ring buffers, scrollback, the event
detector, the protocol, subscription tiers, flow control, and the CLI
(`ls`/`new`/`attach`/`kill`/`send`/`grep`).

Because the CLI is a **first-class product** (D15), not just a harness, this milestone also
owns its command surface: complete `--help`, `--json` output on `ls`/`grep`/`daemon status`,
and daemon autostart so every command works on a machine where the GUI has never run.

**Acceptance:** `mosaico attach` works from inside any ordinary terminal, including over a
plain SSH connection to a headless Linux box with no GUI installed. Kill the client
mid-session and reattach: the screen is byte-identical to what it should be. `vim`, `htop`,
`git log --graph`, a progress bar and CJK/emoji output all render correctly through the
parser (golden tests). A slow client is demoted, never blocking the PTY read loop — with a
test that proves it. Integration tests run in CI on Windows and Linux.

## M3 — App v0.1, tiling only (~4–6 weeks)

The Tauri app, frames and splits, profile detection, the config system with the full
appearance cascade, themes and importers, the action registry, keybindings and chords,
copy/paste with the safety rules, in-pane search, copy mode, and the attach/detach flow.

No canvas yet. One frame fills the window — an ordinary, excellent tiled terminal.

**Acceptance:** the author uses it daily on Windows instead of Windows Terminal for two
weeks without reaching for the old one. Config hot-reload works; a broken config never
crashes the app. Every appearance key works at every cascade level (exhaustive tests).

## M4 — The canvas (~4–6 weeks)

The board plane, continuous zoom, the camera, LOD tiers wired to subscription tiers, the
shared-canvas renderer and glyph atlas, the renderer-slot pool, minimap rendering,
drag-and-drop of panes and frames, snapping, spatial focus navigation across frames, alerts
and badges, and `canvas.mode = "modal"` as the alternative.

**Acceptance:** 20 panes, 5 of them streaming output, ≥ 45 fps while panning and zooming.
Dragging a pane out of a frame and into another works without losing a session. Alerts are
legible at every zoom level. Zooming never resizes a PTY (test it with `stty size` in a
loop).

## M5 — Power features (~3–4 weeks)

Command palette and fuzzy session switcher, workspaces and templates with reattach-matching,
broadcast input with every guard rail, cross-session search, shell integration for
pwsh/bash/zsh/fish, and OS notifications.

**Acceptance:** a workspace of 6 panes opens, is closed, and reopens reattached to the same
running processes. Global search finds a line in a session with no pane open. Broadcast
cannot be enabled on an excluded profile.

## M6 — Linux parity and public 0.1.0 (~2–3 weeks)

Linux PTY and socket paths, WebKitGTK verification (M1's benchmarks re-run there), the
`--renderer=canvas` fallback proven working, AppImage and `.deb`, MSI and NSIS, a docs site,
a theme gallery, `README`, `CONTRIBUTING`, `SECURITY.md`, issue templates, shell completions
and a documented CLI reference (D15), and the `MIT OR Apache-2.0` licence files (D16).

This is also where the repository **flips from private to public** (D14) and where the
unsigned-release decision (D17) is executed: published checksums, and a README section
explaining the SmartScreen prompt honestly rather than hiding it. Docs are English only
(D18); the app UI ships bilingual.

**Acceptance:** someone who has never seen the project installs it on both OSes and reaches
a working, styled, multi-pane setup using only the published docs — including someone who
only ever uses the CLI.

## M7+ — After 0.1.0

macOS (needs a Mac); a plugin API; remote attach as an explicitly-enabled, separately
audited feature; image protocols (sixel/kitty); serial profiles; live daemon upgrade via fd
handoff on Unix.

---

## Risks and the fallback ladder

**R1 — WebView2 performance (high impact, moderate likelihood).** The whole design assumes
a webview can render many terminals while panning and zooming. If M1 says otherwise, in
order of preference:

1. **Render everything ourselves.** Drop xterm.js for the board; one canvas, our glyph
   atlas, at every tier — the Diff/minimap renderer already does exactly this, so the Live
   tier just becomes another case. Biggest code cost, best control, no engine dependency.
2. **Switch to Electron.** Chromium's compositor is better-behaved and better-documented
   for this workload. Costs the small binary and the low memory floor, keeps everything
   else — no architecture changes, since the daemon and protocol are engine-independent.
3. **Render natively in Rust with `wgpu`**, webview only for chrome. Best performance,
   largest rewrite, and it makes the UI much harder to style.

The daemon, the protocol and the object model survive all three intact. **That is the
point of the split** — the risky decision is quarantined on one side of a process
boundary, and the fallback ladder is written down now, while it is cheap.

**R2 — Daemon crash loses sessions.** Inherent (see
[02-architecture.md § Honest caveat](02-architecture.md#honest-caveat)). Mitigation: keep
the daemon small and dull, no rendering, `panic = "abort"` with a crash report, the most
thorough test suite in the repo, a watchdog, and honest documentation about what survives
what.

**R3 — Scope.** Canvas + daemon + full theming + palette + workspaces + broadcast + search
is a lot, and terminal emulation is a famously deep well. Mitigation: M3 must be a genuinely
good tiling terminal on its own. If everything after it stalled, the project would still
have shipped something worth using.

**R4 — Input correctness.** Dead keys, IME, AltGr, and OS-reserved key combinations are
where terminals-in-webviews break, and PT-BR keyboards hit the dead-key path constantly.
Mitigation: it is an M1 acceptance criterion, not a late-stage bug report.

**R5 — Windows code signing.** Decided (D17): 0.1.0 ships **unsigned**, with published
checksums and an honest README note about the SmartScreen prompt. This is a real cost —
a share of casual installs simply will not happen — accepted deliberately so the spend
waits until there is evidence anyone wants the thing. Revisit at 0.2.0; Microsoft's
subscription signing service is the cheaper option to evaluate then, assuming
TechTelligence meets its eligibility rules.

**R6 — Memory.** 20 sessions × parsed scrollback can become gigabytes if the encoding is
naive. Mitigation: RLE with an interned attribute table, hard per-session byte caps,
eviction tested against pathological input, and memory reported in `daemon status`.

**R7 — Single maintainer.** An open-source terminal attracts feature requests fast.
Mitigation: the non-goals list in the product spec is a contract with future-you; point at
it and close the issue.

---

## Questions answered, 2026-09-13

| # | Question | Answer |
|---|---|---|
| 1 | Hours per week | 10–20 h — estimates above hold; 0.1.0 realistically Mar–May 2027 |
| 2 | Repo public or private | Private until 0.1.0, public at M6 |
| 3 | CLI first-class? | Yes — supported product, stable flags, works headless |
| 4 | Licence | `MIT OR Apache-2.0` |
| 5 | Windows signing | Unsigned for 0.1.0; revisit at 0.2.0 |
| 6 | Docs language | English only; app UI bilingual |

Nothing is now blocking M1.

## What gets revisited, and when

These are not open questions — they are decisions with a scheduled review, so they don't
get quietly forgotten:

- **Code signing** — at 0.2.0, if 0.1.0 shows real download interest. **[0.2.0]**
- **`canvas.mode` default** — after two weeks of daily use in M4, confirm `continuous`
  beats `modal` in practice rather than only on paper. **[M4]**
- **LOD thresholds** (11 / 5 / 2 px) — starting points for M1 measurement, tuned once the
  real renderer exists. **[M4]**
- **Scrollback memory estimates** (1–3 MB/session after RLE) — validated with real output
  in M2; the caps and eviction path exist regardless. **[M2]**
- **macOS** — only when someone has a Mac to test on. Until then the code paths exist and
  the platform is documented as unsupported. **[M7+]**
- **Docs language** — English only stands unless a Portuguese-speaking user base actually
  materializes, which is a good problem to reconsider it for. **[after 0.1.0]**
