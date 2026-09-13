# Mosaico — design documents

A customizable terminal session manager. Sessions live in a background daemon and
survive the app; panes are arranged on a zoomable plane instead of a tab bar.

**Status: specification complete, all 18 decisions made. No code written yet — M1 is the next step.**

These documents are the design artifact for milestone M0. They are written to be
lifted, as-is, into a new standalone repository when we start building — see
[§ Where this code lives](#where-this-code-lives).

| Document | What it covers |
|---|---|
| [01-product-spec.md](01-product-spec.md) | What Mosaico is, who it's for, the object model, the UX, every feature |
| [02-architecture.md](02-architecture.md) | Processes, the daemon, the IPC protocol, the renderer, per-OS notes |
| [03-config-reference.md](03-config-reference.md) | The full TOML schema — appearance cascade, profiles, themes, keybindings |
| [04-security.md](04-security.md) | Threat model and the decisions that follow from it |
| [05-roadmap.md](05-roadmap.md) | Milestones with acceptance criteria and dates, risks, fallback ladder |

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
| D13 | Capacity | 10–20 h/week — the roadmap's estimates hold as written | 2026-09-13 |
| D14 | Repo visibility | Private until 0.1.0, then public | 2026-09-13 |
| D15 | The CLI | A first-class, supported product — not just a test harness | 2026-09-13 |
| D16 | Licence | `MIT OR Apache-2.0` | 2026-09-13 |
| D17 | Windows signing | Ship 0.1.0 unsigned; revisit at 0.2.0 | 2026-09-13 |
| D18 | Docs language | English only (the app UI stays bilingual) | 2026-09-13 |

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

### D14 — private does not mean closed

D4 chose open source and D14 chose private-until-0.1.0. These do not conflict: the repo
opens at the public release, under the D16 licence, with its full history. Until then the
work happens without an audience for the rough middle. The practical consequence is that
`SECURITY.md`, `CONTRIBUTING.md`, issue templates and the licence files land at **M6**,
not at M1 — but the code is written the whole way as if it were already public.

### D15 — what "first-class CLI" commits us to

`mosaico attach` becomes a supported way to use Mosaico, not a side effect of testing:

- A stable command surface within a major version. Flags do not change meaning; removals
  get a deprecation warning for one minor cycle first.
- Complete `--help` on every command, plus shell completions for pwsh/bash/zsh/fish.
- Machine-readable output (`--json`) on `ls`, `grep` and `daemon status`, so it scripts.
- It must work on a machine where the GUI has **never** run: the CLI starts the daemon
  itself, and every command works over a plain SSH connection to a headless box.

This is a real widening of the audience — plenty of people will never open the GUI but
would use a modern tmux — paid for with docs and a compatibility promise.

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

M1 has started, so the future repo's contents now live under `mosaico/` in the website
monorepo, laid out exactly as the standalone repo will be: `README.md`, both licence
files, `docs/`, and `spike/`.

**The move is a manual step, because Claude cannot create repositories** — the GitHub App
integration returns 403 on repository creation. To complete it:

```sh
gh repo create app-techtelligence/mosaico --private \
  --description "A terminal session manager: sessions on a zoomable board, in a daemon that outlives the app."
git clone https://github.com/app-techtelligence/mosaico && cd mosaico
cp -r <monorepo>/mosaico/. .
git add -A && git commit -m "chore: import design docs and M1 spike" && git push
```

Then delete `mosaico/` from the website monorepo. Nothing is coupled to it — no shared
config, no imports, no CI wiring, and the folder sits outside the pnpm workspace globs
(`apps/*`, `packages/*`) so it never entered that build. The repo flips to public at M6,
licensed `MIT OR Apache-2.0` (D16).
