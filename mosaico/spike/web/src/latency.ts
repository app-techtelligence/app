/**
 * Keypress → glyph-on-screen latency.
 *
 * What each sample includes, precisely — the number is meaningless without this:
 *
 *   t0   the real `keydown` event (not a synthetic one: synthetic input skips exactly
 *        the OS and engine work we are trying to measure)
 *   …    LOCAL mode: the page echoes the character straight back, so the sample covers
 *        engine input handling + xterm parse + paint, and nothing else.
 *        PTY mode: the byte goes to the bridge, through the real PTY, the shell echoes
 *        it, and it comes back — so the sample covers everything the real app would do.
 *   t1   the first `requestAnimationFrame` after xterm reports the write as parsed,
 *        i.e. the frame on which the glyph can first be painted.
 *
 * PTY samples are only counted when exactly one keystroke is outstanding. Shells echo in
 * bursts, and pairing a burst against a queue of timestamps would quietly invent data.
 */

import { Terminal } from "@xterm/xterm";
import { WebglAddon } from "@xterm/addon-webgl";
import { fpsFrom, ms, summarize, type Stats } from "./stats";
import type { PtyLink } from "./pty";

export type LatencyMode = "local" | "pty";

export class LatencyProbe {
  private term: Terminal;
  private samples: number[] = [];
  private pending: number[] = [];
  private decoder = new TextDecoder();

  constructor(
    host: HTMLElement,
    private mode: LatencyMode,
    private pty: PtyLink | null,
    private onSample: (count: number, stats: Stats) => void,
    useWebgl = true,
  ) {
    this.term = new Terminal({
      cols: 72,
      rows: 10,
      fontSize: 14,
      fontFamily: "Consolas, 'DejaVu Sans Mono', monospace",
      theme: { background: "#11151b", foreground: "#c3ccd8" },
      cursorBlink: false, // a blinking cursor repaints on its own and muddies the samples
    });
    this.term.open(host);
    if (useWebgl) {
      try {
        this.term.loadAddon(new WebglAddon());
      } catch {
        /* fall back to the default renderer — reported separately by the context probe */
      }
    }

    // Timestamp the real key event, before anything else runs.
    host.addEventListener(
      "keydown",
      (e) => {
        if (e.key.length !== 1 && e.key !== "Enter") return;
        this.pending.push(performance.now());
      },
      { capture: true },
    );

    this.term.onData((data) => {
      if (this.mode === "local") {
        const t0 = this.pending.shift();
        this.echo(data, t0);
      } else {
        this.pty?.send(data);
      }
    });

    this.term.write(
      this.mode === "local"
        ? "Type here. The page echoes locally — no shell involved.\r\n\r\n"
        : "Type here, one character at a time. Goes through the real shell.\r\n\r\n",
    );
  }

  /** Feed PTY output in, for the end-to-end mode. */
  feed(bytes: Uint8Array): void {
    if (this.mode !== "pty") return;
    // Only a sample with exactly one keystroke outstanding is attributable.
    const t0 = this.pending.length === 1 ? this.pending.shift() : undefined;
    this.pending.length = 0;
    this.echo(this.decoder.decode(bytes), t0);
  }

  private echo(data: string, t0: number | undefined): void {
    this.term.write(data, () => {
      if (t0 === undefined) return;
      requestAnimationFrame((t1) => {
        this.samples.push(t1 - t0);
        this.onSample(this.samples.length, summarize(this.samples));
      });
    });
  }

  get stats(): Stats {
    return summarize(this.samples);
  }

  reset(): void {
    this.samples = [];
    this.pending = [];
    this.term.write("\r\n\x1b[90m— reset —\x1b[0m\r\n");
    this.onSample(0, this.stats);
  }

  focus(): void {
    this.term.focus();
  }

  dispose(): void {
    this.term.dispose();
  }
}

export function verdict(stats: Stats): string {
  if (stats.n < 20) return "need at least 20 samples";
  const target = 20; // docs/05-roadmap.md M1: p99 keypress→glyph under 20 ms
  return stats.p99 <= target
    ? `PASS — p99 ${ms(stats.p99)} (budget ${target} ms)`
    : `FAIL — p99 ${ms(stats.p99)} exceeds the ${target} ms budget`;
}

export const impliedFps = fpsFrom;
