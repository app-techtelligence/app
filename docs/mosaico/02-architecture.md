# Mosaico — architecture

## 1. Shape of the system

Three pieces, two process boundaries.

```
┌──────────────────────────────────────────────────────────────┐
│  mosaico  (Tauri app)                                        │
│                                                              │
│  ┌────────────────────────┐    ┌──────────────────────────┐  │
│  │ webview (TypeScript)   │◄──►│ app core (Rust)          │  │
│  │  • board renderer      │ IPC│  • config load + watch   │  │
│  │  • xterm.js instances  │    │  • protocol client       │  │
│  │  • palette, UI chrome  │    │  • window, tray, updater │  │
│  └────────────────────────┘    └────────────┬─────────────┘  │
└───────────────────────────────────────────────┼──────────────┘
                                                │  named pipe (Windows)
                                                │  unix socket (Linux/macOS)
                                                │  never TCP
┌───────────────────────────────────────────────▼──────────────┐
│  mosaicod  (daemon — outlives every app window)              │
│                                                              │
│   session ── PTY ── child process tree                       │
│      ├─ VT parser  → authoritative screen grid               │
│      ├─ raw ring   → exact replay on attach                  │
│      ├─ scrollback → parsed lines, search, minimap           │
│      └─ event detector → alerts (OSC 133 + heuristics)       │
└──────────────────────────────────────────────────────────────┘
```

The app is a **viewer**. It owns pixels, input and config. It owns no terminal state. Any
number of viewers can attach to the same session, and zero viewers is a normal state.

### Why the split is worth its cost

D6 asked for shells that survive the app. But the split pays for itself several times over
beyond persistence, and those extra payoffs are what make it the right call rather than
merely the requested one:

- **The daemon parses.** It holds a real screen grid, not a byte stream. That is what makes
  attach instant (send the grid, not 4 MB of replayed ANSI), makes canvas snapshots
  possible without a terminal instance per pane, makes cross-session search work for panes
  nobody is looking at, and makes alerts detectable centrally.
- **The daemon throttles.** It decides how much each viewer gets (see [§ 5](#5-subscription-tiers)).
  The UI never receives data it cannot draw, which is the entire performance strategy for
  the canvas.
- **The fragile half is separable.** Webviews and GPU drivers crash. A small daemon that
  does no rendering does not. Isolating shells from the crashy process is the point.

### Honest caveat

Shells survive the **app**, not the **daemon**. If `mosaicod` dies, its PTYs close and the
child processes get a hangup. There is no way around this short of a process supervisor
per shell, which is a different and much larger product.

This is a design constraint, not a footnote: the daemon must stay small, allocate
predictably, have no rendering code, `panic = "abort"` with a crash report, and be the
most heavily tested crate in the repo. A watchdog restarts it, but restarted is not
recovered. Future work: fd handoff for live upgrades on Unix (`SCM_RIGHTS`); not available
for ConPTY, so Windows upgrades will always end sessions.

## 2. Crate and package layout

```
mosaico/
├─ crates/
│  ├─ mosaico-proto/     message types + codec. No I/O. Shared by every other crate.
│  ├─ mosaico-core/      sessions, PTY, VT parser, ring buffers, events. No I/O loop.
│  ├─ mosaico-daemon/    mosaicod: transport, connections, supervision.
│  ├─ mosaico-client/    async client for the protocol, used by the app and the CLI.
│  └─ mosaico-cli/       mosaico ls/attach/kill/…  — also the headless test harness.
├─ app/
│  ├─ src-tauri/         Tauri shell: windows, config, updater, bridges to mosaico-client
│  └─ src/               TypeScript UI
│     ├─ board/          camera, layout math, LOD selection, hit-testing
│     ├─ render/         shared-canvas renderer + glyph atlas (snapshot & minimap tiers)
│     ├─ term/           xterm.js instances, renderer-slot pool (live tier)
│     ├─ actions/        the action registry — palette and keybindings both read it
│     └─ ui/             chrome, palette, settings, dialogs
├─ themes/
├─ shell-integration/    OSC 133 snippets: pwsh, bash, zsh, fish
├─ bench/                latency, throughput and fps harnesses
└─ docs/
```

`mosaico-core` deliberately contains **no I/O loop**: sessions are driven by a caller that
feeds bytes in and pulls events out. That is what makes the VT parser, the ring buffers
and the event detector testable with golden files and property tests, without spawning
anything.

### Frontend choices

React 19 + TypeScript strict + Vite. React is the right call here purely for fluency — it
is what the rest of this author's work uses — and the performance-critical surface is
imperative canvas code that React never touches. State in Zustand. No CSS framework: the
theme system generates CSS custom properties, the same token approach as the author's web
projects. No scene-graph library for the board — a custom renderer over one `<canvas>` is
less code than bending a general-purpose library, and we need exact control (see [§ 6](#6-level-of-detail-lod)).

**Pin every version during M1 and verify the terminal library situation first-hand** —
xterm.js, its addons and the state of its renderers must be checked against reality at
implementation time, not assumed from this document.

## 3. Sessions in the daemon

Each session owns:

| Component | Default size | Purpose |
|---|---|---|
| PTY handle + child | — | ConPTY on Windows, `openpty` on Unix, via `portable-pty` |
| **raw ring** | 1 MiB | Recent raw bytes, for byte-exact replay to a newly attached live viewer |
| **grid** | cols × rows | Authoritative parsed screen, alt-screen aware. The truth for attach and snapshots |
| **scrollback** | 10 000 lines | Parsed lines with attributes — search, minimap history, dump |
| **event detector** | — | OSC 133 marks, idle timers, exit codes, bell, user regexes |

Memory: a naive parsed line at 200 columns is ~1.6 KB, so 10 000 lines is ~16 MB per
session worst case — unacceptable at 20 sessions. Lines are therefore stored
run-length-encoded over attribute spans with an interned attribute table, which for real
terminal output lands around 1–3 MB per session. `limits.scrollback_bytes_per_session`
caps it regardless, evicting oldest-first, and the daemon reports its own memory in
`mosaico daemon status`. **These numbers are estimates to be validated in M2**, and the
eviction path must be tested with pathological input (a 200-column `cat` of random bytes).

### Resize policy

Multiple viewers can attach to one session at different sizes. Someone has to lose:

- `focused` (default) — the focused viewer's viewport sets cols/rows; others letterbox the
  grid, centered, with dimmed margins. Best for the common case of one real viewer.
- `smallest` — the smallest attached viewport wins, tmux-style. Nothing is ever clipped.
- `pinned` — the session has a fixed size set by the user; every viewer letterboxes.

Per-session overridable. A detached session keeps its last size, so reattaching does not
reflow if the geometry matches.

### Lifecycle

Session end is governed by the profile's `on_exit`: `close` (default), `keep` (leave the
final screen visible and marked dead — the one you want when something crashed and you
need to read why), `restart`, or `prompt`. A `keep` session holds its buffers until closed
explicitly, subject to a configurable reaper for dead sessions nobody has looked at
(default: never — losing a crash log to a timer is worse than the memory).

## 4. Protocol

Framed messages over the local transport. `u32` little-endian length prefix, MessagePack
payload, types defined once in `mosaico-proto` and shared by both sides. First message is a
version handshake; mismatched major versions are refused with a clear error naming both
versions rather than failing obscurely.

**Client → daemon**

| Message | Notes |
|---|---|
| `Hello { proto_version, client_kind }` | Must be first |
| `ListSessions` | |
| `CreateSession { profile, cwd, cols, rows, env, command, name }` | |
| `Attach { session, tier }` / `Detach { session }` | |
| `SetTier { session, tier }` | The LOD hook — see [§ 5](#5-subscription-tiers) |
| `Input { session, bytes }` | Opaque; the daemon never interprets input |
| `Resize { session, cols, rows }` | |
| `Kill { session, signal }` · `Rename` · `SetName` | |
| `Search { session?, pattern, limit }` | `session = None` searches all |
| `GetScrollback { session, from, to }` | |
| `Ack { session, seq }` | Flow control |

**Daemon → client**

| Message | Notes |
|---|---|
| `Welcome { proto_version, daemon_version, capabilities }` | |
| `SessionList { … }` | |
| `Output { session, seq, bytes }` | Live tier only |
| `ScreenDiff { session, seq, changed_rows }` | Diff tier |
| `Snapshot { session, grid }` | Snapshot tier, and always on attach |
| `Event { session, kind, payload }` | Alerts, title change, cwd change, command start/end |
| `Exit { session, code, at }` | |
| `Error { code, message }` | |

### Flow control

Every content message carries a `seq`; clients `Ack` periodically. If a client's unacked
window exceeds `limits.client_window` the daemon **demotes that client to the Diff tier**
and logs it, rather than buffering without bound or blocking the PTY read loop. Output
never stalls because a viewer is slow, and a slow viewer degrades in quality rather than
falling over. The PTY read loop is never blocked by a client under any circumstance — that
invariant is worth a test of its own.

## 5. Subscription tiers

The single most important mechanism in the design. Each attached pane subscribes to its
session at a tier, and the daemon sends only what that tier requires:

| Tier | Daemon sends | Typical use |
|---|---|---|
| `Live` | Raw bytes, immediately | The focused pane and anything readable |
| `Diff(hz)` | Changed rows from the parsed grid, ≤ N Hz (default 10) | Small but still legible panes |
| `Snapshot(hz)` | Whole grid, ≤ N Hz (default 1), coalesced | Minimap and card tiers |
| `Events` | Nothing but alerts | Off-screen, or explicitly muted |

The canvas LOD maps **directly** onto these tiers. Zooming out does not merely draw less —
it *asks for* less, all the way down to the daemon, so the IPC volume, the parse work and
the paint work all shrink together. A board of 20 mostly-idle shells costs almost nothing;
a board of 20 panes each tailing a busy log costs bounded, predictable work instead of
20× the work of one.

This is also the answer to D11 ("live near, snapshot far"): it is not a rendering hack
bolted on at the end, it is the transport contract.

## 6. Level of detail (LOD)

Tier is chosen per pane from its **rendered cell height** — how many screen pixels one
terminal row currently occupies — not from a zoom number, so it stays correct across DPI
scales and per-pane font sizes.

| Cell height | Tier | How it is drawn |
|---|---|---|
| `≥ 11 px` | Live | A real xterm.js instance, positioned over the board. Full interaction, selection, links |
| `5–11 px` | Diff | We paint the grid ourselves into the shared board canvas from a glyph atlas. Roughly readable, very cheap |
| `2–5 px` | Minimap | Each cell is a 1–2 px block colored from its attributes. You see the *shape* of output — prose vs. table vs. stack trace vs. progress bar |
| `< 2 px` | Card | No cell content. Header only: name, profile color, status dot, activity sparkline |

Thresholds are configurable; the defaults are a starting point for M1 measurement, not
received wisdom.

### The WebGL context problem, and the shared canvas

A browser engine allows only a handful of simultaneous WebGL contexts (order of 8–16,
engine-dependent). One xterm.js WebGL instance per pane therefore cannot scale to a board
of 20, and exceeding the limit silently kills the oldest contexts — a spectacular failure
mode.

So:

- **A renderer-slot pool.** `canvas.live_renderer_slots` (default 6) GPU-backed xterm.js
  instances, assigned by an LRU over focus and proximity to the camera. Live panes beyond
  the budget fall back to xterm's non-GPU renderer, which is fine because they are by
  definition not the pane you are working in.
- **One shared canvas for everything below Live.** Diff, minimap and card tiers are painted
  by our own renderer into a *single* `<canvas>` covering the board — one context, one
  draw loop, one glyph atlas, regardless of how many panes. Twenty snapshot panes cost one
  context, not twenty.
- **Crossfade on promotion.** Zooming in, a pane's real terminal mounts behind its painted
  snapshot and crossfades once it has rendered its first frame, so promotion never flashes.

Text is never CSS-scaled. Scaled glyphs are blurry and scaled *terminal* glyphs are
illegible; each tier rasterizes at its actual size, which is also why the minimap tier
stops pretending to draw text at all.

### Card chrome is zoom-independent

Headers, badges and borders are drawn at constant screen size at every zoom level. A board
zoomed far out still reads as labelled, color-coded cards with legible status — which is
the whole reason to zoom out.

## 7. Input

Keystrokes go to the focused pane's session as bytes, at every zoom level, always
([01-product-spec.md § 3](01-product-spec.md#3-zoom-is-the-mode)). The app's own keybindings
are matched **first**, and everything unmatched falls through to the terminal — with an
explicit escape (`keys.passthrough`) to send a bound combination to the shell anyway.

Areas that must be verified on real hardware in M1, because they are where terminals
usually break and where a webview is least trustworthy:

- **Dead keys and AltGr on a PT-BR keyboard.** `´` + `a` → `á`, `~` + `a` → `ã`, `ç`,
  `AltGr`. This is a daily-use blocker for the author and a classic webview-input bug.
- **IME composition** — composition must not leak partial input to the PTY.
- **Bracketed paste**, multi-line paste, and very large pastes (chunked, never one write).
- **`Ctrl` combinations** the webview wants for itself, and OS-reserved combinations.
- **High-DPI and mixed-DPI multi-monitor** — moving a window between monitors of different
  scale factors must not corrupt cell metrics.

## 8. Platform notes

### Windows (first)

- PTY: ConPTY. It redraws aggressively on resize and injects its own sequences; our grid
  is the normalizing layer. There is no OS-level detach for ConPTY, which is precisely why
  the daemon's ring buffer *is* the reattach mechanism.
- Transport: named pipe `\\.\pipe\mosaico-<hash of user SID>`, ACL restricted to the
  current user. Client identity verified via `GetNamedPipeClientProcessId` and a token SID
  comparison — never trust the pipe alone.
- Shell detection: PowerShell 7 (`pwsh`), Windows PowerShell, `cmd`, Git Bash, MSYS2,
  Cygwin, Developer PowerShell for VS, and every installed WSL distro via `wsl.exe -l -v`.
- Webview: **WebView2 — the single biggest technical risk in this design** (see
  [05-roadmap.md § Risks](05-roadmap.md#risks-and-the-fallback-ladder)). M1 exists mostly
  to measure it.
- Packaging: MSI and NSIS. Unsigned binaries trigger SmartScreen; see
  [04-security.md § Releases](04-security.md#8-releases-and-supply-chain).

### Linux (second)

- PTY: `openpty`, standard and uneventful.
- Transport: `$XDG_RUNTIME_DIR/mosaico/daemon.sock`, mode `0600`, peer verified with
  `SO_PEERCRED`.
- Webview: WebKitGTK — a different engine with a different performance profile, so **the
  M1 benchmarks must be re-run on it** rather than assumed to pass. WebGL there is
  driver-sensitive; `--renderer=canvas` must be a working fallback, not a theoretical one.
- Packaging: AppImage and `.deb`; Flatpak later (its sandbox and a session daemon need
  thought).

### macOS (later)

Unix PTY, WKWebView, socket under `$TMPDIR`. The code paths exist from day one but stay
**untested and undocumented as supported** until someone has a Mac to test on. Claiming
support we cannot verify is worse than admitting the gap.

## 9. Testing strategy

| Layer | How |
|---|---|
| VT parser | Golden-file tests: input byte stream → expected grid. Seeded from a public conformance corpus and from real captured output (`vim`, `htop`, `git log --graph`, progress bars, CJK and emoji widths) |
| Ring buffers | Property tests: replay-after-attach must equal the live grid, for any split of the byte stream |
| Protocol | Round-trip property tests on every message; explicit version-mismatch tests |
| Daemon | Integration tests driving the real daemon through `mosaico-cli` with scripted shells — no GUI, runs in CI on Windows and Linux |
| Layout / LOD / config cascade | Vitest on pure functions. The cascade in particular deserves exhaustive tests: it is the feature most likely to produce quiet, confusing bugs |
| App | Playwright against the built app, if Tauri's WebDriver path proves workable (verify in M1); otherwise a headless harness around the UI logic |
| Performance | `bench/` measures keypress→paint latency, `cat`-a-large-file throughput, and board fps at N panes, with CI gates on regressions |

Config documentation is **generated from the schema** by a test, so
`03-config-reference.md` cannot drift from the code. A documented key that no longer exists
should fail CI.
