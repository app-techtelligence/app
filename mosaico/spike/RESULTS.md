# M1 results

> Fill this in from a real Windows run. Until the verdict line says `GO` or `NO-GO`,
> M2 has not started. See [README.md](README.md) for how to run each panel.

## Verdict

**— not yet run —**

<!--
Replace with one of:

GO — WebView2 meets the budgets. Proceeding to M2 as specified.
NO-GO — <which budget failed, by how much>. Taking fallback <1|2|3> from
        ../docs/05-roadmap.md § Risks: <name it, and why that rung>.
-->

## Machine

| | |
|---|---|
| Device | <!-- laptop/desktop, model --> |
| CPU | |
| GPU | <!-- and whether it's the one the browser actually used --> |
| RAM | |
| Display(s) | <!-- resolution and scale factor of each; note if mixed --> |
| Windows version | |
| Edge / WebView2 version | |
| On battery or mains? | <!-- matters more than people expect: power profiles throttle GPUs --> |

## Numbers

Paste the probe's **copy as markdown** output here.

| Measurement | Value |
| --- | --- |
| | |

## Against the budgets

| # | Measurement | Budget | Actual | Pass? |
|---|---|---|---|---|
| 1 | Keypress → glyph, p99, through the PTY | < 20 ms | | |
| 2 | 50 MB flood | no UI stall, bounded memory | | |
| 3 | 20 panes, 3+ streaming, camera moving | ≥ 45 fps | | |
| 4 | Simultaneous WebGL contexts | ≥ 8 for a 6-slot pool | | |
| 5 | PT-BR dead keys and AltGr | correct bytes | | |
| 6 | IME composition | nothing partial reaches the PTY | | |
| 7 | Mixed-DPI move | cell metrics survive | | |

### Keyboard detail

The bytes panel 4 reported, so this is checkable later rather than remembered:

| Input | Expected | Observed |
|---|---|---|
| `´` then `a` | nothing, then `C3 A1` (á) | |
| `~` then `a` | nothing, then `C3 A3` (ã) | |
| `ç` | `C3 A7` | |
| AltGr + <!-- key --> | | |
| IME composition | only the final composed text | |

## What surprised me

<!--
The most valuable section. Anything that behaved unexpectedly, even if it passed:
a stutter you could feel but the numbers missed, memory that climbed and didn't come
back, a pane that went blank, fans spinning up. The numbers are the gate; this is what
saves time in M3 and M4.
-->

## Consequences for the design

<!--
What has to change in ../docs/ because of what the numbers showed. For example:
  * live_renderer_slots default, if the context limit is lower than 8
  * the LOD thresholds (11 / 5 / 2 px), if text becomes unreadable earlier or later
  * whether the Live tier can use xterm.js at all
Update the docs in the same commit that fills this in, so they can never disagree.
-->

## If NO-GO: which rung, and why

<!--
From ../docs/05-roadmap.md § Risks and the fallback ladder:
  1. Render everything ourselves (drop xterm.js for the board)
  2. Switch to Electron
  3. Render natively with wgpu, webview only for chrome

Say which, and what specifically ruled out the rungs above it. The daemon, protocol and
object model survive all three — re-estimate M2 onward, don't redesign.
-->
