<!-- markdownlint-disable MD041 -->
# Mosaico

A terminal where sessions are arranged in **space** instead of a tab bar, run in a
**daemon that outlives the app**, and can be styled down to the **individual pane**.

> **Status: M1.** The design is complete and every decision is made. The only code that
> exists is a throwaway spike whose job is to prove the stack before the real build
> starts. Nothing here is usable yet.

## The idea

tmux gives you sessions you navigate by index. Windows Terminal gives you a tab bar that
stops being useful past eight tabs. Both force the same trade: see *one* thing well, or
*many* things badly.

Mosaico puts terminals on an unbounded plane. Zoom out and you see all of them at once —
not readable, but **legible**: which one is producing output, which one errored, which one
is waiting for you. Zoom in and you have an ordinary, excellent, tiled terminal.

Everything else follows from that. Sessions must outlive the window, or zooming out to
check on a build is pointless. Panes must be individually styleable, or a plane of twenty
identical black rectangles is unnavigable.

## Documentation

Read in this order:

| | |
|---|---|
| [docs/01-product-spec.md](docs/01-product-spec.md) | What it is, the object model, the UX, every feature |
| [docs/02-architecture.md](docs/02-architecture.md) | Processes, the daemon, the protocol, the renderer, per-OS notes |
| [docs/03-config-reference.md](docs/03-config-reference.md) | The TOML schema — appearance cascade, profiles, themes, keys |
| [docs/04-security.md](docs/04-security.md) | Threat model and the decisions that follow from it |
| [docs/05-roadmap.md](docs/05-roadmap.md) | Milestones with acceptance criteria, risks, the fallback ladder |
| [docs/README.md](docs/README.md) | The decision log — 18 decisions with their alternatives |

## Where things stand

| Milestone | State |
|---|---|
| M0 — specification | done |
| **M1 — spike: prove the stack** | **code written, not yet measured** |
| M2 — daemon core | not started |
| M3 — app v0.1, tiling | not started |
| M4 — the canvas | not started |
| M5 — power features | not started |
| M6 — Linux parity, public 0.1.0 | not started |

M1 exists because the whole design rests on one assumption: that a webview can render
many terminals at once with low input latency. See [spike/README.md](spike/README.md) —
and note that **Phase A needs nothing but a browser**, so most of the risk can be retired
in an afternoon.

## Repository layout

```
mosaico/
├── docs/      the design. Read this first — it is the actual deliverable so far.
└── spike/     M1. Throwaway.
    ├── web/   the browser probe  (Phase A — no install needed beyond a browser)
    └── pty/   the PTY bridge     (Phase B — Rust, real shells)
```

The real crate layout — `mosaico-proto`, `mosaico-core`, `mosaico-daemon`,
`mosaico-client`, `mosaico-cli`, and the Tauri app — arrives with M2 and is specified in
[docs/02-architecture.md § 2](docs/02-architecture.md#2-crate-and-package-layout).

## Licence

`MIT OR Apache-2.0`, at your option. See [LICENSE-MIT](LICENSE-MIT) and
[LICENSE-APACHE](LICENSE-APACHE).

This repository is private until 0.1.0, then public — the licence is set now so it never
has to be renegotiated with contributors later.
