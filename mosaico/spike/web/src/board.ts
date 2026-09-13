/**
 * The board probe: N real xterm.js terminals at once, some GPU-accelerated, some
 * streaming output, measured at rest and under camera motion.
 *
 * What this does and does not tell us — read before trusting the numbers:
 *
 *   * STATIC is the honest one. It is exactly what the real app does at the Live tier:
 *     N terminal instances on screen, k of them receiving output, camera still. If this
 *     is slow, the design is in trouble.
 *
 *   * MOTION drives a CSS transform over the whole board. The real app deliberately does
 *     NOT scale text this way (docs/02-architecture.md § 6 — scaled glyphs are illegible),
 *     so this is an UPPER BOUND on compositor headroom, not a measurement of the real
 *     zoom path. Treat it as "can the compositor move this many layers at all".
 */

import { Terminal } from "@xterm/xterm";
import { WebglAddon } from "@xterm/addon-webgl";
import { fpsFrom, recordFrames, summarize, type Stats } from "./stats";

export interface BoardOptions {
  panes: number;
  webglPanes: number;
  streaming: number;
  seconds: number;
  motion: boolean;
}

export interface BoardResult {
  options: BoardOptions;
  webglActual: number;
  contextLosses: number;
  frames: Stats;
  fps: number;
}

const SAMPLE_LINES = [
  "\x1b[36m$\x1b[0m pnpm dev",
  "  \x1b[32m✓\x1b[0m compiled in 340ms",
  "  GET /board 200 in 18ms",
  "  \x1b[33m○\x1b[0m recompiling …",
  "  src/module_042/file_0117.rs  ok",
  "  \x1b[31mERROR\x1b[0m connection reset, retrying",
];

/** Build the board, run the measurement, tear everything down. */
export async function runBoardProbe(
  host: HTMLElement,
  opts: BoardOptions,
  log: (msg: string) => void,
): Promise<BoardResult> {
  host.textContent = "";
  const stage = document.createElement("div");
  stage.className = "board-stage";
  host.appendChild(stage);

  const cols = Math.ceil(Math.sqrt(opts.panes));
  stage.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  const terms: Terminal[] = [];
  const addons: WebglAddon[] = [];
  let contextLosses = 0;
  let webglActual = 0;

  for (let i = 0; i < opts.panes; i++) {
    const cell = document.createElement("div");
    cell.className = "board-cell";
    stage.appendChild(cell);

    const term = new Terminal({
      cols: 40,
      rows: 12,
      fontSize: 11,
      fontFamily: "Consolas, 'DejaVu Sans Mono', monospace",
      theme: { background: "#11151b", foreground: "#c3ccd8" },
      scrollback: 400,
      allowProposedApi: true,
    });
    term.open(cell);
    terms.push(term);

    if (i < opts.webglPanes) {
      // A failure here is a real result, not an error to hide: it is the context limit.
      try {
        const addon = new WebglAddon();
        addon.onContextLoss(() => {
          contextLosses++;
          log(`pane ${i}: WebGL context lost`);
        });
        term.loadAddon(addon);
        addons.push(addon);
        webglActual++;
      } catch (e) {
        log(`pane ${i}: WebGL addon refused — ${String(e)}`);
      }
    }

    term.write(`\x1b[90m— pane ${i} —\x1b[0m\r\n`);
  }

  // Let layout and first paint settle before measuring anything.
  await new Promise((r) => setTimeout(r, 400));

  const timers: number[] = [];
  for (let i = 0; i < Math.min(opts.streaming, terms.length); i++) {
    const term = terms[i]!;
    let n = 0;
    timers.push(
      window.setInterval(() => {
        term.write(`${SAMPLE_LINES[n % SAMPLE_LINES.length]!} ${n}\r\n`);
        n++;
      }, 50),
    );
  }

  log(
    `measuring ${opts.seconds}s — ${opts.panes} panes, ${webglActual} on WebGL, ` +
      `${opts.streaming} streaming, camera ${opts.motion ? "moving" : "still"}`,
  );

  const deltas = await recordFrames(opts.seconds, (t) => {
    if (!opts.motion) return;
    // A slow sweep through the zoom range the real app would use, plus a drift.
    const zoom = 0.35 + 0.45 * (1 + Math.sin(t * 1.1)) * 0.5;
    const x = Math.sin(t * 0.7) * 60;
    const y = Math.cos(t * 0.5) * 40;
    stage.style.transform = `translate(${x}px, ${y}px) scale(${zoom.toFixed(3)})`;
  });

  timers.forEach((id) => window.clearInterval(id));
  addons.forEach((a) => a.dispose());
  terms.forEach((t) => t.dispose());
  host.textContent = "";

  const frames = summarize(deltas);
  return { options: opts, webglActual, contextLosses, frames, fps: fpsFrom(frames) };
}

/**
 * How many WebGL contexts will this engine give us before it starts refusing or
 * silently dropping the oldest? This is the number that decides the renderer-slot
 * budget in docs/02-architecture.md § 6.
 */
export function probeWebglContextLimit(max = 64): { created: number; lost: number; hitCap: boolean } {
  const canvases: HTMLCanvasElement[] = [];
  const contexts: WebGLRenderingContext[] = [];
  let lost = 0;
  let created = 0;

  for (let i = 0; i < max; i++) {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    c.addEventListener("webglcontextlost", () => lost++);
    const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) break;
    canvases.push(c);
    contexts.push(gl);
    created++;
  }

  for (const gl of contexts) gl.getExtension("WEBGL_lose_context")?.loseContext();
  canvases.length = 0;
  // created === max means we ran out of patience, not that the engine ran out of
  // contexts. Reporting that as a hard limit would understate the real headroom.
  return { created, lost, hitCap: created === max };
}
