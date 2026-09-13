/**
 * Keyboard and display inspectors.
 *
 * The keyboard one exists because of a specific, concrete risk: a PT-BR layout uses dead
 * keys constantly (´ + a → á, ~ + a → ã, plus ç and AltGr), and dead keys and IME
 * composition are where terminals-in-webviews classically break. This panel shows the
 * exact bytes xterm would send to the shell, so "it works" is something you can see
 * rather than assume.
 */

import { Terminal } from "@xterm/xterm";

export interface KeyRow {
  kind: "data" | "composition";
  label: string;
  bytes: string;
}

const PRINTABLE = /^[\x20-\x7e]$/;

/** Render a string as readable byte notation: `á` → `C3 A1  "á"`. */
export function describe(data: string): string {
  const bytes = Array.from(new TextEncoder().encode(data))
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
  const printable = Array.from(data)
    .map((ch) => (PRINTABLE.test(ch) ? ch : `\\u${ch.codePointAt(0)!.toString(16).padStart(4, "0")}`))
    .join("");
  return `${bytes}   "${printable}"`;
}

export class KeyboardInspector {
  private term: Terminal;

  constructor(host: HTMLElement, private onRow: (row: KeyRow) => void) {
    this.term = new Terminal({
      cols: 60,
      rows: 6,
      fontSize: 14,
      fontFamily: "Consolas, 'DejaVu Sans Mono', monospace",
      theme: { background: "#11151b", foreground: "#c3ccd8" },
    });
    this.term.open(host);
    this.term.write("Type accented characters here.\r\n");

    this.term.onData((data) => {
      this.term.write(data);
      this.onRow({ kind: "data", label: "onData", bytes: describe(data) });
    });

    // xterm keeps a hidden textarea; composition events land on it.
    const textarea = host.querySelector("textarea");
    if (textarea) {
      for (const type of ["compositionstart", "compositionupdate", "compositionend"] as const) {
        textarea.addEventListener(type, (e) => {
          const data = (e as CompositionEvent).data ?? "";
          this.onRow({ kind: "composition", label: type, bytes: data ? describe(data) : "(empty)" });
        });
      }
    }
  }

  focus(): void {
    this.term.focus();
  }

  dispose(): void {
    this.term.dispose();
  }
}

export interface DisplayInfo {
  devicePixelRatio: number;
  cellWidth: number;
  cellHeight: number;
  screen: string;
}

/**
 * Measure the actual rendered size of one monospace cell. Mixed-DPI bugs show up here
 * first: drag the window to a monitor with a different scale factor and re-measure — if
 * the cell size does not change proportionally, text will be blurry or misaligned.
 */
export function measureDisplay(): DisplayInfo {
  const probe = document.createElement("span");
  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:pre;font:14px Consolas,'DejaVu Sans Mono',monospace";
  probe.textContent = "M".repeat(100);
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();

  return {
    devicePixelRatio: window.devicePixelRatio,
    cellWidth: rect.width / 100,
    cellHeight: rect.height,
    screen: `${window.screen.width}×${window.screen.height} @ ${window.devicePixelRatio}x`,
  };
}

/** Fires whenever the window moves to a display with a different scale factor. */
export function onDpiChange(cb: (dpr: number) => void): () => void {
  let query: MediaQueryList | null = null;
  let stopped = false;

  const arm = () => {
    if (stopped) return;
    query?.removeEventListener("change", handler);
    query = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    query.addEventListener("change", handler);
  };
  const handler = () => {
    cb(window.devicePixelRatio);
    arm();
  };
  arm();

  return () => {
    stopped = true;
    query?.removeEventListener("change", handler);
  };
}
