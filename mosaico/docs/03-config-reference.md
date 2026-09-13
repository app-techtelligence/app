# Mosaico — configuration reference

Format: TOML. Reloaded live on save. A file that fails to parse or validate produces a
toast naming the file and line while the previous good config keeps running — Mosaico never
crashes on bad config and never silently falls back to defaults.

> This document is the design of the schema. Once `mosaico-core` exists, this file is
> **generated from the schema by a test** so it cannot drift from the code.

## Locations

| OS | Config | Themes | Workspace state |
|---|---|---|---|
| Windows | `%APPDATA%\mosaico\mosaico.toml` | `%APPDATA%\mosaico\themes\` | `%LOCALAPPDATA%\mosaico\state\` |
| Linux | `$XDG_CONFIG_HOME/mosaico/mosaico.toml` | `…/mosaico/themes/` | `$XDG_STATE_HOME/mosaico/` |
| macOS | `~/.config/mosaico/mosaico.toml` | `~/.config/mosaico/themes/` | `~/Library/Application Support/mosaico/` |

Config is **hand-editable and authoritative**. The settings UI edits this same file and
preserves comments and key order — it is a view onto the file, not a parallel store, so
the two can never disagree.

## The cascade

`[appearance]` is one schema that is valid at every level. Later levels override earlier
ones, key by key:

```
1. built-in defaults
2. [appearance]                      global
3. [profile.<name>.appearance]       per kind of pane
4. [workspace.<name>.appearance]     per saved arrangement
5. frame appearance                  (workspace state, set by the UI)
6. pane appearance                   (runtime override, persisted)
7. CLI flags                         one-off, highest priority
```

Level 3 is where most real customization lives: set `tint` once on the `ssh-prod` profile
and every production pane is red forever.

## `[appearance]`

Valid at every cascade level. Every key is optional; unset means inherit.

```toml
[appearance]
theme            = "mosaico-dark"      # name of a theme file
opacity          = 1.0                 # 0.0–1.0, whole pane
tint             = "#3A1212"           # color wash over the background — environment coding
dim_unfocused    = 0.15                # 0 = off; dims panes that aren't focused
corner_radius    = 8                   # px
padding          = { top = 8, right = 10, bottom = 8, left = 10 }

[appearance.font]
family           = ["Cascadia Code", "JetBrains Mono", "Consolas", "monospace"]
size             = 13.0                # pt
weight           = 400
weight_bold      = 700
line_height      = 1.2                 # multiplier
letter_spacing   = 0.0                 # px
ligatures        = true
feature_settings = "'ss01' 1, 'cv01' 1"   # raw OpenType features

[appearance.cursor]
shape            = "block"             # block | beam | underline
blink            = true
color            = "#E6E6E6"           # omit to use the theme's cursor color
unfocused_shape  = "hollow"            # block | beam | underline | hollow | hidden

[appearance.border]
width            = 1
color            = "#2A2A2A"
focused_color    = "#7AA2F7"
broadcast_color  = "#E0AF68"           # while this pane receives broadcast input

[appearance.background]
color            = "#11121A"           # omit to use the theme's background
image            = "C:/wall/grid.png"
image_fit        = "cover"             # cover | contain | tile | center
image_opacity    = 0.08
blur             = 0                   # px, where the platform supports it

[appearance.selection]
color            = "#2D4F67"

[appearance.scrollbar]
visible          = "auto"              # auto | always | never
color            = "#3A3A3A"
marks            = true                # show search matches and command marks

[appearance.colors]                    # per-index overrides on top of the theme
black = "#15161E"
red   = "#F7768E"
# … through bright_white, plus foreground/background/cursor
```

## Themes

A theme is a standalone file in `themes/`, so it can be dropped in, exported, and shared:

```toml
name    = "mosaico-dark"
author  = "…"
variant = "dark"                       # dark | light — drives UI chrome

[colors]
foreground = "#C0CAF5"
background = "#1A1B26"
cursor     = "#C0CAF5"
selection  = "#2D4F67"
black = "#15161E"   ;  red = "#F7768E"   ;  green = "#9ECE6A"
# … 16 ANSI colors

[ui]                                   # optional: app chrome, derived from colors if absent
header_bg      = "#16161E"
header_fg      = "#787C99"
board_bg       = "#0D0E14"
accent         = "#7AA2F7"
```

Importers ship for the common formats (Windows Terminal, iTerm2, Alacritty, base16) so
nobody starts from an empty palette. `mosaico theme import <file>` and a palette action.

## `[profile.<name>]`

```toml
[profile.pwsh]
type        = "local"                  # local | wsl | ssh
command     = "pwsh.exe"
args        = ["-NoLogo"]
cwd         = "~"
env         = { TERM = "xterm-256color" }
icon        = "powershell"
color       = "#2E86DE"                # card accent — how you recognize it zoomed out
on_exit     = "close"                  # close | keep | restart | prompt
shell_integration = "auto"             # auto | off
appearance  = { tint = "#0E1A2B" }

[profile.wsl-ubuntu]
type        = "wsl"
distro      = "Ubuntu"
user        = "leandro"
startup_dir = "~"

[profile.ssh-prod]
type          = "ssh"
host          = "prod.example.com"     # resolved through your ~/.ssh/config
user          = "deploy"
port          = 22
identity_file = "~/.ssh/id_ed25519"    # a path only — never a passphrase or key material
forward_agent = false
keepalive     = 30
reconnect     = { enabled = true, max_attempts = 5, backoff = "2s..60s" }
color         = "#C0392B"
appearance    = { tint = "#3A1212", border = { focused_color = "#E74C3C" } }
alerts        = { output_after_idle = "30s" }
```

Mosaico never stores passwords or key material. SSH authentication is delegated entirely
to the system `ssh` client and agent.

Detected profiles are written into your config on first run, commented, as a starting
point you can edit or delete — not hidden magic.

## `[keys]`

Every action in the registry is bindable; nothing is hardcoded. Chords are supported, so
tmux muscle memory is reproducible without shipping tmux's defaults.

```toml
[keys]
leader = "ctrl+a"                      # enables "leader <key>" chord syntax

"ctrl+shift+p"      = "palette.open"
"ctrl+shift+space"  = "board.overview"
"ctrl+shift+enter"  = "board.focus_frame"
"alt+left"          = "focus.left"     # spatial — crosses frame boundaries
"ctrl+shift+d"      = "pane.split_right"
"leader d"          = "session.detach"
"leader c"          = "pane.new"
"ctrl+shift+alt+f"  = "search.all_sessions"
"ctrl+shift+b"      = "broadcast.toggle"
"ctrl+w"            = { action = "passthrough" }   # send to the shell, don't intercept

[keys.copy_mode]                       # per-mode maps: normal | copy | canvas
"v" = "copy.start_selection"
"y" = "copy.yank"

[copy_mode]
style = "vim"                          # vim | windows
```

Unbinding is `"ctrl+shift+w" = false`. Multiple bindings per action are allowed. Conflicts
are reported in the settings UI rather than resolved silently.

## `[canvas]`

```toml
[canvas]
mode                = "continuous"     # continuous | modal  (see product spec § 3)
zoom_min            = 0.05
zoom_max            = 3.0
zoom_step           = 1.15
animation_ms        = 180              # 0 disables camera animation
live_renderer_slots = 6                # GPU-backed terminal instances; the rest degrade
snap                = { enabled = true, grid = 20, to_frames = true, threshold = 12 }
overlap             = "discourage"     # discourage | allow | prevent

[canvas.lod]                           # thresholds in rendered px per terminal row
live_above      = 11
diff_above      = 5
minimap_above   = 2
diff_hz         = 10
snapshot_hz     = 1
```

## `[alerts]`

```toml
[alerts]
output_after_idle = "10s"              # false to disable
exit_nonzero      = true
exit_zero_after   = "30s"              # badge successful commands that took a while
bell              = true
prompt_idle       = true
sound             = false
os_notification   = "when_unfocused"   # never | when_unfocused | always

[[alerts.match]]                       # regex alerts, evaluated in the daemon
pattern = "(?i)\\b(error|fatal|panic)\\b"
level   = "error"
profiles = ["*"]
```

## `[broadcast]`

```toml
[broadcast]
confirm_above    = 3                   # confirm before enabling with more targets than this
auto_disable     = "on_focus_change"   # on_focus_change | on_pane_exit | never
exclude_profiles = ["ssh-prod"]        # never broadcastable — the guard rail that matters
```

## `[general]`, `[limits]`, `[daemon]`

```toml
[general]
locale               = "auto"          # auto | pt-BR | en
restore_on_launch    = "last_workspace"  # none | last_workspace | <workspace name>
confirm_close_running = true
check_for_updates    = true

[limits]
scrollback_lines              = 10000
scrollback_bytes_per_session  = "16MiB"
raw_ring_bytes                = "1MiB"
client_window                 = "8MiB"    # unacked bytes before a viewer is demoted
max_sessions                  = 128

[daemon]
autostart       = true                 # the app starts mosaicod if it isn't running
idle_shutdown   = false                # never shut down with live sessions
log_level       = "warn"               # trace|debug|info|warn|error — see security § logging
persist_scrollback = false             # OFF by default. See 04-security.md § 3
```

## Project workspace files

A directory may contain `mosaico.workspace.toml` with the same `[[frames]]` schema as
[01-product-spec.md § 6](01-product-spec.md#6-workspaces-and-templates). It is **untrusted
until explicitly approved**, because it contains commands —
[04-security.md § 5](04-security.md#5-workspace-trust).
