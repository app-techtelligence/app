# Mosaico — roadmap, risks, open questions

Milestones are **sequenced, not scheduled**. The week estimates assume steady part-time
work and exist to convey relative size; they are not commitments, and the available hours
per week are still unknown ([open question 5](#open-questions)).

Each milestone has acceptance criteria. A milestone is not done because the code exists —
it is done when the criteria are demonstrably met.

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

**Acceptance:** `mosaico attach` works from inside any ordinary terminal. Kill the client
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
a theme gallery, `README`, `CONTRIBUTING`, `SECURITY.md`, the license, and issue templates.

**Acceptance:** someone who has never seen the project installs it on both OSes and reaches
a working, styled, multi-pane setup using only the published docs.

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

**R5 — Windows code signing.** Unsigned installers trigger SmartScreen and lose most
first-time users. Needs a decision and a budget before M6.

**R6 — Memory.** 20 sessions × parsed scrollback can become gigabytes if the encoding is
naive. Mitigation: RLE with an interned attribute table, hard per-session byte caps,
eviction tested against pathological input, and memory reported in `daemon status`.

**R7 — Single maintainer.** An open-source terminal attracts feature requests fast.
Mitigation: the non-goals list in the product spec is a contract with future-you; point at
it and close the issue.

---

## Open questions

Answer these before the milestone in brackets.

1. **License** — `MIT OR Apache-2.0` (the Rust ecosystem norm, maximum adoption) or GPL-3.0
   (keeps derivatives open)? Recommendation: `MIT OR Apache-2.0`. **[before M6]**
2. **Windows code signing** — buy a certificate, or ship unsigned with a documented
   SmartScreen workaround for 0.1.0? **[before M6]**
3. **Repository** — create `app-techtelligence/mosaico` public from the first commit
   (building in public), or private until 0.1.0? **[before M1]**
4. **Documentation language** — English-only for reach, or bilingual PT-BR/EN? A Brazilian
   OSS project with Portuguese docs is genuinely differentiated, and it doubles the
   maintenance. The app UI itself should be bilingual either way. **[before M6]**
5. **Hours per week** — needed to turn the sequence above into a calendar. **[now]**
6. **Is the CLI a first-class product?** `mosaico attach` could be a genuinely useful
   tmux-alternative for people who never open the GUI. Treating it as a supported product
   costs polish and documentation; treating it as a test harness costs nothing. **[before M2]**
