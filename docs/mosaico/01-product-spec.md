# Mosaico — product specification

## 1. The thesis

Terminal multiplexers make you remember where things are. tmux has sessions you navigate
by index; Windows Terminal has a tab bar that stops being useful past eight tabs. Both
force the same trade: you can see *one* thing well, or *many* things badly.

Mosaico's bet is that **space is a better index than a list**. Terminals live on an
unbounded plane. You zoom out and see all of them at once — not readable, but *legible*:
which one is producing output, which one errored, which one is waiting for you. You zoom
in and you have an ordinary, excellent, tiled terminal. Nothing is hidden behind a tab you
forgot you opened.

Everything else follows from that: the sessions must outlive the window (or zooming out to
check on a build is pointless), and the panes must be individually styleable (or a plane
of 20 identical black rectangles is unnavigable).

### The one-sentence version

> A terminal where your sessions are arranged in space instead of a tab bar, run in a
> daemon that outlives the app, and can be styled down to the individual pane.

### Who it's for

- People who keep 6–20 shells open: dev server, logs, tests, database, deploy, two SSH
  sessions, and a scratch shell they can never find again.
- People who care what their terminal looks like — enough to have opinions about the font
  and to want a red tint on production and a green one on staging.
- Windows developers first. The Windows terminal ecosystem is thinner than Unix's, and
  WSL + native shells side by side is a real, common, badly-served workflow.

### Non-goals

Explicitly out of scope. Each of these is someone else's product:

- **Not a shell.** Mosaico runs your shell; it does not replace it or parse your commands.
- **Not an editor, IDE, or file manager.** No embedded text editor, no project tree.
- **Not an AI terminal.** No command suggestion, no natural-language-to-shell, no cloud.
- **Not a cloud/collaboration product.** No accounts, no sync, no shared sessions
  (see [D10](README.md#decision-log)).
- **Not tmux-compatible.** We do not implement tmux's protocol, config format, or
  keybindings. An import tool for themes is in scope; an emulation layer is not.
- **Not a serial/console client.** No COM ports, no serial profiles, in v1.

## 2. Object model

Five objects. Everything in the UI and in the protocol is one of these.

```
Session      a live PTY + process tree, owned by the daemon, independent of any window
  └─ Pane    a view of a session inside a frame        (a session may have 0..N panes)
       └─ Frame   a tiled container of panes — a split tree — drawn as one card
            └─ Board   an unbounded plane holding frames at (x, y, w, h)
                 └─ Workspace   named set of boards + config overrides, saved and restored
```

**Session.** Owned by `mosaicod`. Has an id, an optional name, a profile, a working
directory, a title (from the shell), a status, and its own scrollback. It exists whether or
not anything is looking at it. Closing the app does not touch it.

**Pane.** A *view*, not a thing. Zero panes = the session runs detached. Two panes on one
session = the same shell mirrored in two places (both live, both typeable — useful for
watching one log at two zoom levels, or on two monitors).

**Frame.** A conventional split tree, exactly like Windows Terminal or tmux: binary
splits, horizontal or vertical, resizable dividers, no overlap inside the frame. A frame
with one pane is just a terminal card. **A frame is what a tab used to be** — except it has
a position instead of a slot in a bar.

**Board.** The plane. Frames sit on it at arbitrary positions and may be arranged however
you like, including overlapping (discouraged, allowed, snapping on by default). The board
is unbounded; there is no "off the edge".

**Workspace.** A named, saved arrangement: boards, frames, pane layout, per-pane appearance
overrides, and which profiles/commands to launch. Opening a workspace reconstructs the
whole thing. See [§ 6 Workspaces](#6-workspaces-and-templates).

### Why frames exist

They are the piece that makes "tiling **and** canvas" (D1) coherent instead of ambiguous.

The obvious naive design gives every pane both a tile position and a canvas position, and
then has to answer: if I drag a pane on the canvas, does the tile layout change? Every
answer to that is bad. Inferring a split tree from arbitrary rectangles is fragile, and
keeping two independent layouts means the app silently forgets one of your arrangements.

With frames there is no ambiguity, because there is only one layout. Inside a frame,
tiling. Between frames, free placement. Dragging a pane *out* of a frame makes a new frame;
dragging it *into* one splits that frame. The plane holds frames; the frames hold splits.

## 3. Zoom is the mode

There is no "canvas mode" button. Zoom is continuous, and the app's character changes with
it because the *rendering* changes with it (see
[02-architecture.md § Level of detail](02-architecture.md#6-level-of-detail-lod)).

| Zoom | What you have |
|---|---|
| Focused (`1.0`) | An ordinary tiled terminal. One frame fills the viewport. Indistinguishable from Windows Terminal in feel. |
| Pulled back | Neighbouring frames visible around the edges. Still fully readable and typeable. |
| Overview | A dozen frames at once. Text becomes a texture; headers, colors, and alert badges carry the meaning. |
| Far | Cards only — name, profile color, status. A map of your work. |

`Focus frame` (default `Ctrl+Shift+Enter`) animates zoom and pan so one frame fits the
viewport exactly — the "get back to normal" key. `Overview` (default `Ctrl+Shift+Space`)
zooms to fit all frames. Both are just camera moves, so you can interrupt them by panning.

**Typing always goes to the focused pane**, at every zoom level, even when that pane is
2 px tall. Zoom is a camera, never a mode switch that swallows keystrokes. This is the
single rule that makes continuous zoom safe.

**Critically: zoom never resizes a PTY.** A pane has a logical size in columns and rows;
zoom changes how many screen pixels that grid is painted into. Programs never see a resize
because you looked at them from further away. (Resizing a *frame* or dragging a divider
does resize the PTY — that's a layout change, not a camera move.)

If the continuous model turns out to be disorienting in daily use, `canvas.mode = "modal"`
restores a hard toggle: one key swaps between a maximized-frame view and a fixed overview,
with nothing in between. The underlying model does not change — only the camera's allowed
positions do. We ship `continuous` as the default and keep `modal` as a supported escape
hatch, not a deprecated leftover.

## 4. Interaction

### Mouse and trackpad

| Gesture | Action |
|---|---|
| Wheel / two-finger scroll | Scroll the focused pane's scrollback (terminal-first, as expected) |
| `Ctrl` + wheel, pinch | Zoom the board around the cursor |
| Middle-drag, space-drag, two-finger drag on empty board | Pan |
| Drag a frame's header | Move the frame on the board |
| Drag a pane's header out of a frame | Detach it into a new frame at the drop point |
| Drag a pane onto another pane | Split that pane — drop zones on the four edges pick the direction |
| Drag a frame edge / internal divider | Resize (this **does** resize the PTY) |
| Double-click a frame header | Focus that frame (zoom to fit) |
| Click a pane | Focus it without moving the camera |

Snapping is on by default: frames snap to a configurable grid and to each other's edges,
with a modifier to override. Without snapping a board of 15 frames turns into a mess within
a week.

### Keyboard

Everything is bindable and nothing is hardcoded (see
[03-config-reference.md § keys](03-config-reference.md#keys)). Both direct bindings and
leader chords are supported, so tmux muscle memory can be reproduced (`Ctrl+A` then a key)
without us shipping tmux's bindings by default.

Defaults are deliberately close to Windows Terminal so the app is usable on day one
without reading documentation:

| Key | Action |
|---|---|
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+Shift+T` / `Ctrl+Shift+D` | New frame / split focused pane |
| `Alt+←↑→↓` | Focus the pane in that direction (spatial, crosses frame boundaries) |
| `Ctrl+Shift+←↑→↓` | Move the focused pane/frame |
| `Ctrl+Shift+Enter` | Focus frame (zoom to fit) |
| `Ctrl+Shift+Space` | Overview (zoom to fit all) |
| `Ctrl+Shift+F` | Search in pane · `Ctrl+Shift+Alt+F` search all sessions |
| `Ctrl+Shift+C` / `V` | Copy / paste (never steals `Ctrl+C` from the shell) |
| `Ctrl+Shift+W` | Close pane (with confirmation when a process is running) |

**Spatial navigation crosses frames.** `Alt+→` from the rightmost pane of one frame moves
to the nearest pane of the frame to its right on the board. The plane is the layout, so
directional focus must honour it — otherwise frames become invisible walls.

## 5. Alerts — why zooming out is worth doing

An overview is only useful if it tells you something. Each pane can raise events, rendered
as badges at **constant screen size** at every zoom level, so they stay legible when the
text does not:

| Event | Meaning | Default |
|---|---|---|
| `output_after_idle` | Quiet for N seconds, then produced output | on, 10 s |
| `exit_nonzero` | The foreground command exited non-zero | on |
| `exit_zero` | A long-running command finished successfully | on, > 30 s |
| `bell` | The shell rang the terminal bell | on |
| `prompt_idle` | Back at a prompt, waiting for input | on |
| `match` | Output matched a user regex (`ERROR`, `FATAL`, …) | off, user-defined |

`exit_*` and `prompt_idle` need to know where commands start and end, which the daemon
learns from **OSC 133 shell integration** — a few lines added to your `pwsh`/`bash`/`zsh`/
`fish` profile, shipped with the app and installable from the command palette. Without it,
those three events degrade gracefully to heuristics and everything else still works.

Shell integration also buys, for free: per-command exit status and duration in the card
header, "jump to previous/next command" in scrollback, and correct `cwd` tracking for
"open a new pane here".

Alerts are per-profile configurable, and a pane can be muted. A board where everything
badges constantly is a board you stop looking at.

## 6. Workspaces and templates

A workspace is a named arrangement, defined in config or captured from the live app
("Save board as workspace…"). Launching one spawns every pane, in position, in the right
directory, running the right command.

```toml
[workspace.client-acme]
board.zoom = 0.6

[[workspace.client-acme.frames]]
at = { x = 0, y = 0, w = 900, h = 700 }
panes = [
  { profile = "pwsh", cwd = "D:/acme/api",  command = "pnpm dev",  name = "api" },
  { profile = "pwsh", cwd = "D:/acme/web",  command = "pnpm dev",  name = "web", split = "down" },
]

[[workspace.client-acme.frames]]
at = { x = 940, y = 0, w = 700, h = 340 }
panes = [{ profile = "ssh-acme-prod", name = "prod", appearance = { tint = "#3A1212" } }]
```

Rules:

- Launching a workspace **reuses** matching live sessions rather than starting duplicates —
  matched by workspace + pane name. Reopening a workspace after closing the window
  reattaches to the shells that kept running (D6). This is the payoff for the daemon.
- A workspace may be stored in the user config or in a project directory as
  `mosaico.workspace.toml`. Project files are **untrusted until you approve them** — they
  contain commands. See [04-security.md § Workspace trust](04-security.md#5-workspace-trust).
- Restoring is best-effort and says so: if a directory is gone or a command fails, the pane
  opens with an inline error banner instead of failing the whole workspace.

## 7. Command palette and session switcher

One surface, two behaviours, driven by a prefix — the way a good editor does it:

- Typing runs a fuzzy match over **every action in the registry**. The registry is the same
  one keybindings bind to, so anything you can bind you can run, and the palette shows the
  current binding next to each entry. An action with no binding is still reachable.
- `>` restricts to sessions: fuzzy-match on session name, profile, title, or working
  directory. `Enter` focuses it (camera moves), `Alt+Enter` pulls it into the current frame.
- `:` runs a one-off command in a new pane. `?` opens help.

This is what makes 20 panes tractable without the mouse, and it is the reason the action
registry is a first-class thing in the architecture rather than a switch statement.

## 8. Broadcast input

Type once, send to many. The standard tool for driving a fleet, and the most dangerous
feature in the app — a mistyped `rm` goes everywhere at once. So:

- Targets are **explicitly selected** (click panes, or select a frame, or "all panes with
  profile X"). Never implicit, never "all panes" by accident.
- Receiving panes get an unmissable persistent treatment: a colored border, a header
  badge, and a status-bar count — configurable in color, not in existence.
- Turning broadcast **on** with more than `broadcast.confirm_above` targets (default 3)
  requires a confirmation naming the count.
- New panes created while broadcast is active are **never** auto-included.
- Broadcast turns itself off when focus leaves the broadcast group, and on any pane exit.
- A dry-run indicator shows exactly what would be sent before the first keystroke.

## 9. Search and scrollback

- **In-pane:** regex or literal, incremental, match count, `Enter`/`Shift+Enter` to step,
  all matches marked on the scrollbar.
- **Across all sessions:** the daemon holds parsed scrollback for every session, attached or
  not, so a global search answers "which of these 14 panes printed that stack trace?" —
  including panes in workspaces that are currently closed. Results are grouped by session
  with context lines; `Enter` jumps to the pane *and* to the line.
- **Copy mode:** keyboard selection without the mouse, vim-style or Windows-style
  (`copy_mode.style`), block selection with `Alt`.
- **Dump:** write a pane's full scrollback to a file, or pipe the last command's output —
  cheap once the daemon already has the buffer, and the thing you always want at 2 a.m.

Scrollback is **memory-only by default and never written to disk** — it contains tokens,
keys and customer data. See [04-security.md § Scrollback](04-security.md#3-scrollback-is-memory-only).

## 10. Appearance — the per-pane system (D7)

One schema, `[appearance]`, valid at **every** level of the cascade: global → profile →
workspace → frame → pane → runtime override. A pane inherits until something overrides it,
and any key can be overridden at any level.

Covered: font family (with fallback chain), size, weight, bold weight, ligatures and
OpenType feature settings; line height; letter spacing; cursor shape, blink and color;
padding per side; corner radius; border width and focused/unfocused colors; background
color, image, fit, opacity and blur; a per-pane **tint** wash; unfocused dimming;
selection and scrollbar colors; the theme; and per-index ANSI color overrides.

The full key list, types and defaults are in
[03-config-reference.md § appearance](03-config-reference.md#appearance).

Two conventions this exists to serve:

1. **Environment coding.** Production panes are tinted red, staging amber, local neutral —
   set once on the profile, inherited by every pane using it. You stop typing into the
   wrong window. This is the actual reason per-pane visual control is worth building.
2. **Legibility at distance.** The profile color drives the card header and the minimap
   tint, so at overview zoom you recognize a pane by its color before you can read it.

Themes are standalone files that can be dropped in, exported and shared, with importers
for the common formats so nobody starts from an empty palette. Editing config applies
live — the file is watched, and a broken file shows a toast with the line number while the
previous config keeps running. The app never crashes on bad config and never silently
reverts to defaults.

## 11. Profiles

A profile is "a kind of pane": what to run, where, with what environment, and how it looks.

- **local** — a shell or command. Auto-detected on first run: PowerShell 7, Windows
  PowerShell, `cmd`, Git Bash, MSYS2, every installed WSL distro; on Linux, the shells in
  `/etc/shells`. Detection is a starting point written into your config, not magic — you
  can edit or delete any of it.
- **wsl** — a distro, a user and a startup directory.
- **ssh** — a host from your `~/.ssh/config`, with optional reconnect-with-backoff. Because
  sessions live in the daemon, an SSH pane survives closing the window; because the daemon
  is local-only (D10), the connection is an ordinary `ssh` process, and authentication is
  your system agent's job. **Mosaico never stores a password or a private key.**

## 12. The CLI — a supported product, not a side effect

`mosaico` is also a terminal command, because a session manager that can only be driven by
its own GUI is half a tool. It is a **first-class deliverable** (D15): plenty of people
will never open the GUI but would use a modern tmux, and they are part of the audience.

```
mosaico ls                      list sessions: id, name, profile, status, cwd, age
mosaico new --profile pwsh      create a session (optionally without any window)
mosaico attach <id>             attach the current terminal to a session — no GUI needed
mosaico kill <id>               terminate
mosaico send <id> -- <text>     write to a session's input
mosaico grep <regex>            search every session's scrollback
mosaico workspace open <name>   launch a workspace
mosaico daemon start|stop|status|upgrade
```

What being first-class commits us to:

- **A stable surface** within a major version. Flags do not change meaning; a removal gets
  a deprecation warning for one minor cycle first.
- **Complete `--help`** on every command, plus shell completions for pwsh, bash, zsh, fish.
- **`--json`** on `ls`, `grep` and `daemon status`, so output is scriptable rather than
  something you have to parse out of a table.
- **No GUI required, ever.** The CLI starts the daemon itself, and every command works over
  a plain SSH connection to a headless box where the app has never been installed.

It is also how the daemon gets properly tested: the whole of M2 is verified through the CLI
with no GUI in the loop (see [05-roadmap.md § M2](05-roadmap.md#m2--daemon-core-34-weeks)).

## 13. What "done" means for v0.1

A terminal the author uses every day, on Windows, instead of Windows Terminal — without
compromises they notice. Concretely: real shells including WSL, tiling, the canvas with
working zoom and drag-and-drop, the config and appearance system, full keybindings,
copy/paste/search, the palette, workspaces, broadcast, and sessions that survive closing
the window. Documented, MIT/Apache licensed, with installers for Windows and Linux.

Plus a CLI good enough to use on its own, on a headless machine, with no GUI installed.

Not in v0.1: macOS, remote attach, a plugin API, serial profiles, image protocols
(sixel/kitty), and any form of sync. The Windows installer for 0.1.0 is **unsigned** (D17)
— checksums are published and the SmartScreen prompt is documented rather than hidden.
