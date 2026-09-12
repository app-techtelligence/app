# Mosaico — design documents

A customizable terminal session manager. Sessions live in a background daemon and
survive the app; panes are arranged on a zoomable plane instead of a tab bar.

**Status: specification only. No code written yet.**

These documents are the design artifact for milestone M0. They are written to be
lifted, as-is, into a new standalone repository when we start building — see
[§ Where this code lives](#where-this-code-lives).

| Document | What it covers |
|---|---|
| [01-product-spec.md](01-product-spec.md) | What Mosaico is, who it's for, the object model, the UX, every feature |
| [02-architecture.md](02-architecture.md) | Processes, the daemon, the IPC protocol, the renderer, per-OS notes |
| [03-config-reference.md](03-config-reference.md) | The full TOML schema — appearance cascade, profiles, themes, keybindings |
| [04-security.md](04-security.md) | Threat model and the decisions that follow from it |
| [05-roadmap.md](05-roadmap.md) | Milestones with acceptance criteria, risks, fallback ladder, open questions |

---

## Decision log

Every decision below was made deliberately, with alternatives considered. Reopening one
is fine — but do it here, with a date, so the reasoning survives.

| # | Decision | Chosen | Date |
|---|---|---|---|
| D1 | Layout model | Tiling **and** a zoomable canvas | 2026-09-12 |
| D2 | Stack | Tauri (Rust) + xterm.js in the webview | 2026-09-12 |
| D3 | Repository | New standalone repo, separate from the website monorepo | 2026-09-12 |
| D4 | Project type | Open source | 2026-09-12 |
| D5 | Platforms | Windows first → Linux → macOS later | 2026-09-12 |
| D6 | Session lifetime | Detachable daemon; shells survive the app | 2026-09-12 |
| D7 | Customization priority | Deep per-pane visual control | 2026-09-12 |
| D8 | First deliverable | Spec and design before any code | 2026-09-12 |
| D9 | Name | Mosaico | 2026-09-12 |
| D10 | Network reach | Local only; SSH and WSL are pane types, not a network daemon | 2026-09-12 |
| D11 | Canvas rendering | Live nearby, snapshot far away, alerts at every zoom | 2026-09-12 |
| D12 | Feature set | Command palette, broadcast input, saved workspaces, cross-pane search | 2026-09-12 |

### D1 — refined during design

D1 asked for "tiling **and** a canvas mode". The spec implements both, but **not as two
modes you toggle between**: they are two zoom levels of a single continuous model. See
[01-product-spec.md § Zoom is the mode](01-product-spec.md#3-zoom-is-the-mode) for why, and
for the `canvas.mode = "modal"` setting that restores a hard toggle if the continuous
model doesn't feel right in practice.

### D7 — scope note

Only "deep per-pane visual control" was selected from the customization options. The
config file, the theme format and full keybinding remapping are specified anyway, because
they are load-bearing: per-pane visual control needs a cascade to live in, and the command
palette (D12) needs an action registry, which is the same registry keybindings bind to.
They are specified at a *baseline* level — the depth and polish goes into per-pane visuals.

### D9 — name availability, checked 2026-09-12

| Namespace | Status |
|---|---|
| GitHub `app-techtelligence/mosaico` | Available (org namespace) |
| crates.io `mosaico` | **Taken** — an unrelated crate, v0.0.2, 43 downloads |
| crates.io `mosaico-core` / `-proto` / `-daemon` / `-cli` / `mosaicod` | Available |
| npm `mosaico` | **Taken** |

This does not block anything. Mosaico ships as a desktop application, not as a published
library: the binaries are `mosaico` (app + CLI) and `mosaicod` (daemon), the config lives
in a `mosaico/` directory, and the crates are workspace-internal. Should we ever want to
publish crates, the `mosaico-*` namespace is free. npm is irrelevant — the frontend is
bundled, never published.

## Where this code lives

D3 chose a standalone repository. The spec is being written on
`claude/terminal-session-manager-ptbiss` in the website monorepo because that is this
session's designated branch, and because a spec with no code has no reason to create a
repo yet.

When M1 starts: create `app-techtelligence/mosaico`, move `docs/mosaico/**` to its `docs/`,
and delete it from this repo. Nothing here is coupled to the monorepo — no shared config,
no imports, no CI wiring.
