# M1 — the spike

**Purpose: find out whether the architecture survives contact with WebView2, before
anything is built on top of it.**

The design in [`../docs/02-architecture.md`](../docs/02-architecture.md) rests on one
assumption: that a webview can render many terminals at once, accept input with low
latency, and keep up with a flood of output. D2 chose Tauri, which on Windows means
WebView2. If that assumption is wrong, the fallback ladder in
[`../docs/05-roadmap.md`](../docs/05-roadmap.md#risks-and-the-fallback-ladder) applies —
and it is much cheaper to find out now than after M3.

Everything in this directory is **throwaway**. None of it is a prototype of the real app.
It exists to produce numbers, and it gets deleted once those numbers are in
[`RESULTS.md`](RESULTS.md).

## Three phases, cheapest first

The roadmap described M1 as one step. Building it revealed it is really three, and
ordering them this way means most of the risk is retired before any Tauri code exists.

| Phase | What it needs | What it answers |
|---|---|---|
| **A — browser probe** | A browser. Nothing installed. | WebGL context limit, many-pane fps, keypress→glyph latency, dead keys / AltGr / IME, DPI behaviour |
| **B — PTY bridge** | Rust toolchain | Real shells (ConPTY on Windows), end-to-end latency through a real PTY, throughput under a flood |
| **C — Tauri wrapper** | Tauri toolchain | Whether packaging changes any of the above |

**Phase A is the important one and costs almost nothing.** Edge on Windows uses the same
engine as WebView2, so opening the probe page in Edge answers most of M1's graphics
questions with no install at all. Do Phase A first. If it fails, stop — the fallback
ladder is the next decision, and there is no point writing Tauri code for an engine that
cannot do the job.

Phase C is deliberately *not* built yet. Wrapping a spike that has already failed is
wasted work, and wrapping one that has passed is a small job.

## Running it

### Phase A — browser only

```sh
cd spike/web
pnpm install
pnpm dev          # then open the URL it prints, in Edge
```

Run every panel, then use **copy as markdown** at the top and paste into `RESULTS.md`.
Panels 3 (latency, "through the PTY" mode) and 5 (throughput) need Phase B; everything
else works standalone.

### Phase B — with a real shell

```sh
cd spike/web && pnpm build     # build the probe once
cd ../pty && cargo run --release
```

The bridge prints a URL carrying a one-time token. Open it — the page connects
automatically, and panels 3 and 5 come alive.

The bridge binds `127.0.0.1` only, never `0.0.0.0`, and requires the token on the
WebSocket upgrade, so a page you happen to have open in another tab cannot drive your
shell. Same posture as the real daemon
([`../docs/04-security.md`](../docs/04-security.md#1-the-daemon-is-local-only)) — worth
keeping even in throwaway code, because it costs about ten lines.

## What to measure, and what counts as a pass

From [`../docs/05-roadmap.md`](../docs/05-roadmap.md#m1--spike-prove-the-stack-12-weeks).
Every one of these must be measured on **real Windows hardware** — the machine you would
actually use Mosaico on, not a VM, not this container, not a MacBook.

| # | Measurement | Budget | Panel |
|---|---|---|---|
| 1 | Keypress → glyph, p99 | < 20 ms | 3 |
| 2 | 50 MB flood | completes, no UI stall, no unbounded memory | 5 |
| 3 | 20 panes, 3+ streaming, camera moving | ≥ 45 fps | 2 |
| 4 | Simultaneous WebGL contexts | measured and written down | 1 |
| 5 | PT-BR dead keys (´+a → á, ~+a → ã, ç) and AltGr | correct bytes | 4 |
| 6 | IME composition | no partial input reaches the PTY | 4 |
| 7 | Mixed-DPI multi-monitor | cell metrics survive the move | 1 |

### Reading the board probe honestly

The board panel runs two measurements and they mean different things:

- **Camera still** is the honest one. It is exactly what the real app does at the Live
  tier: N terminal instances on screen, k of them receiving output. If this is slow, the
  design is in trouble and no amount of cleverness elsewhere rescues it.

- **Camera moving** CSS-transforms the whole board. The real app deliberately will *not*
  scale text that way — scaled glyphs are illegible, which is the entire reason the LOD
  system exists. So this number is an **upper bound on compositor headroom**, not a
  measurement of the real zoom path. A good result here does not prove zooming will be
  smooth; a bad result does prove it will not.

The real zoom path can only be measured once the shared-canvas renderer exists, which is
M4 work. What M1 can rule out is the case where the compositor cannot move this many
layers at all.

### Latency: what the number includes

- **Local echo** — keydown → xterm parse → next paintable frame. Isolates the engine and
  renderer, no shell involved.
- **Through the PTY** — the same, plus the bridge, the real PTY, and the shell's echo.
  This is the number the 20 ms budget is about.

Only samples with exactly one keystroke outstanding are counted: shells echo in bursts,
and pairing a burst against a queue of timestamps would quietly invent data. Type one
character at a time, and give it at least 30 samples.

## Deliverable

A filled-in [`RESULTS.md`](RESULTS.md) with a **go / no-go** at the top. Nothing after M1
starts until that verdict is written down — including, especially, if the verdict is
"go". A spike whose numbers were never recorded is a spike that will be argued about
later from memory.

## Verified where?

The code here was written and checked on Linux: the Rust bridge compiles and round-trips
a real shell, the web probe typechecks and builds, and the whole thing boots and reports
numbers in headless Chromium. **None of that is the measurement.** Linux/Chromium numbers
say nothing about WebView2 on Windows, which is the only question M1 asks. The Windows
run is the work.
