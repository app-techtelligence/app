/**
 * M1 spike — the probe UI.
 *
 * Everything here is throwaway. Its only product is a set of numbers pasted into
 * ../RESULTS.md, which decides whether the architecture in ../../docs/02-architecture.md
 * survives contact with WebView2.
 */

import "@xterm/xterm/css/xterm.css";
import "./style.css";

import { Terminal } from "@xterm/xterm";
import { probeWebglContextLimit, runBoardProbe, type BoardOptions } from "./board";
import { KeyboardInspector, measureDisplay, onDpiChange, type KeyRow } from "./inspect";
import { LatencyProbe, verdict, type LatencyMode } from "./latency";
import { PtyLink, type PtyStatus } from "./pty";
import { fpsFrom, ms, recordFrames, summarize, type Stats } from "./stats";

// ---------------------------------------------------------------- results store

const results = new Map<string, string>();
const resultOrder: string[] = [];

function record(key: string, value: string): void {
  if (!results.has(key)) resultOrder.push(key);
  results.set(key, value);
  renderResults();
}

function renderResults(): void {
  const body = $("#results-body");
  body.textContent = "";
  for (const key of resultOrder) {
    const row = document.createElement("tr");
    const k = document.createElement("td");
    k.textContent = key;
    const v = document.createElement("td");
    v.textContent = results.get(key)!;
    v.className = "num";
    row.append(k, v);
    body.appendChild(row);
  }
}

function resultsMarkdown(): string {
  const lines = ["| Measurement | Value |", "| --- | --- |"];
  for (const key of resultOrder) lines.push(`| ${key} | ${results.get(key)} |`);
  return lines.join("\n");
}

// ---------------------------------------------------------------- helpers

function $(sel: string): HTMLElement {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`missing element: ${sel}`);
  return el as HTMLElement;
}

function num(sel: string): number {
  return Number((document.querySelector(sel) as HTMLInputElement).value);
}

function statLine(s: Stats): string {
  return `p50 ${ms(s.p50)} · p95 ${ms(s.p95)} · p99 ${ms(s.p99)} · max ${ms(s.max)} · n=${s.n}`;
}

function setStatus(el: HTMLElement, text: string, kind: "ok" | "bad" | "" = ""): void {
  el.textContent = text;
  el.className = `status ${kind}`;
}

// ---------------------------------------------------------------- environment

function runEnvironment(): void {
  const d = measureDisplay();
  const ua = navigator.userAgent;
  const engine = /Edg\//.test(ua)
    ? "Edge / WebView2 (Chromium)"
    : /Chrome\//.test(ua)
      ? "Chromium"
      : /Firefox\//.test(ua)
        ? "Gecko"
        : /Safari\//.test(ua)
          ? "WebKit"
          : "unknown";

  record("Engine", engine);
  record("devicePixelRatio", d.devicePixelRatio.toFixed(2));
  record("Screen", d.screen);
  record("Cell size @14px", `${d.cellWidth.toFixed(2)} × ${d.cellHeight.toFixed(2)} px`);

  $("#env-detail").textContent = ua;

  const limit = probeWebglContextLimit();
  const count = limit.hitCap ? `≥${limit.created} (probe cap — no limit found)` : `${limit.created}`;
  record("Max WebGL contexts", `${count}${limit.lost ? ` · ${limit.lost} lost while probing` : ""}`);
  setStatus(
    $("#env-status"),
    limit.created >= 8
      ? `${count} simultaneous WebGL contexts — the 6-slot renderer pool fits`
      : `only ${limit.created} WebGL contexts — the renderer pool must shrink below 6`,
    limit.created >= 8 ? "ok" : "bad",
  );

  onDpiChange((dpr) => {
    const fresh = measureDisplay();
    record("DPI change seen", `→ ${dpr.toFixed(2)}x, cell ${fresh.cellWidth.toFixed(2)} × ${fresh.cellHeight.toFixed(2)} px`);
    setStatus($("#env-status"), `display changed to ${dpr.toFixed(2)}x — check the text is still crisp`, "");
  });
}

// ---------------------------------------------------------------- board

async function runBoard(motion: boolean): Promise<void> {
  const opts: BoardOptions = {
    panes: num("#board-panes"),
    webglPanes: num("#board-webgl"),
    streaming: num("#board-streaming"),
    seconds: num("#board-seconds"),
    motion,
  };
  const status = $("#board-status");
  const buttons = document.querySelectorAll<HTMLButtonElement>(".board-run");
  buttons.forEach((b) => (b.disabled = true));
  setStatus(status, "running…");

  const logLines: string[] = [];
  const res = await runBoardProbe($("#board-host"), opts, (m) => {
    logLines.push(m);
    $("#board-log").textContent = logLines.join("\n");
  });

  const label = motion ? "Board, camera moving" : "Board, camera still";
  record(
    `${label} (${opts.panes} panes, ${res.webglActual} WebGL, ${opts.streaming} streaming)`,
    `${res.fps.toFixed(0)} fps · ${statLine(res.frames)}${res.contextLosses ? ` · ${res.contextLosses} context losses` : ""}`,
  );

  const pass = res.fps >= 45;
  setStatus(
    status,
    `${pass ? "PASS" : "FAIL"} — ${res.fps.toFixed(0)} fps (budget 45) · ${statLine(res.frames)}`,
    pass ? "ok" : "bad",
  );
  buttons.forEach((b) => (b.disabled = false));
}

// ---------------------------------------------------------------- latency

let latencyProbe: LatencyProbe | null = null;
let latencyMode: LatencyMode = "local";

function mountLatency(mode: LatencyMode): void {
  latencyProbe?.dispose();
  latencyMode = mode;
  $("#latency-host").textContent = "";
  latencyProbe = new LatencyProbe(
    $("#latency-host"),
    mode,
    mode === "pty" ? pty : null,
    (count, stats) => {
      $("#latency-count").textContent = `${count} samples`;
      const v = verdict(stats);
      setStatus($("#latency-status"), `${v} · ${statLine(stats)}`, v.startsWith("PASS") ? "ok" : v.startsWith("FAIL") ? "bad" : "");
      if (count >= 20) {
        record(
          mode === "local" ? "Keypress→glyph, local echo" : "Keypress→glyph, through the PTY",
          statLine(stats),
        );
      }
    },
  );
  latencyProbe.focus();
}

// ---------------------------------------------------------------- keyboard

function mountKeyboard(): void {
  const rows: KeyRow[] = [];
  const inspector = new KeyboardInspector($("#kbd-host"), (row) => {
    rows.unshift(row);
    rows.length = Math.min(rows.length, 14);
    const body = $("#kbd-body");
    body.textContent = "";
    for (const r of rows) {
      const tr = document.createElement("tr");
      const a = document.createElement("td");
      a.textContent = r.label;
      a.className = r.kind === "composition" ? "dim" : "";
      const b = document.createElement("td");
      b.textContent = r.bytes;
      b.className = "num";
      tr.append(a, b);
      body.appendChild(tr);
    }
  });
  $("#kbd-host").addEventListener("click", () => inspector.focus());
}

// ---------------------------------------------------------------- throughput

async function runThroughput(): Promise<void> {
  if (!pty.connected) {
    setStatus($("#thr-status"), "connect the PTY bridge first", "bad");
    return;
  }
  const mb = num("#thr-mb");
  const host = $("#thr-host");
  host.textContent = "";

  const term = new Terminal({
    cols: 120,
    rows: 24,
    fontSize: 11,
    fontFamily: "Consolas, 'DejaVu Sans Mono', monospace",
    theme: { background: "#11151b", foreground: "#c3ccd8" },
    scrollback: 1000,
  });
  term.open(host);

  let bytes = 0;
  const prev = ptyConsumers.slice();
  ptyConsumers.length = 0;
  ptyConsumers.push((data) => {
    bytes += data.length;
    term.write(data);
  });

  setStatus($("#thr-status"), `streaming ${mb} MB through the PTY…`);
  const started = performance.now();
  pty.bench(mb);

  // Measure frame times during the flood: a stalled UI is the failure we care about,
  // more than raw bytes per second.
  const seconds = Math.max(6, Math.ceil(mb / 8));
  const deltas = await recordFrames(seconds);
  const elapsed = (performance.now() - started) / 1000;

  ptyConsumers.length = 0;
  ptyConsumers.push(...prev);

  const frames = summarize(deltas);
  const mbps = bytes / 1024 / 1024 / elapsed;
  record(
    `PTY throughput (${mb} MB)`,
    `${mbps.toFixed(1)} MB/s · worst frame ${ms(frames.max)} · ${fpsFrom(frames).toFixed(0)} fps median`,
  );
  const stalled = frames.max > 250;
  setStatus(
    $("#thr-status"),
    `${stalled ? "STALLED" : "OK"} — ${mbps.toFixed(1)} MB/s, worst frame ${ms(frames.max)}, ` +
      `${(bytes / 1024 / 1024).toFixed(1)} MB received in ${elapsed.toFixed(1)}s`,
    stalled ? "bad" : "ok",
  );
  term.dispose();
}

// ---------------------------------------------------------------- PTY wiring

const pty = new PtyLink();
const ptyConsumers: Array<(data: Uint8Array) => void> = [];

pty.onData = (data) => {
  for (const c of ptyConsumers) c(data);
  if (latencyMode === "pty") latencyProbe?.feed(data);
};

pty.onStatus = (status: PtyStatus, detail?: string) => {
  const el = $("#pty-status");
  const kind = status === "connected" ? "ok" : status === "error" ? "bad" : "";
  setStatus(el, detail ? `${status} — ${detail}` : status, kind);
  if (status === "connected") record("PTY bridge", "connected");
};

// ---------------------------------------------------------------- boot

function boot(): void {
  runEnvironment();
  mountKeyboard();
  mountLatency("local");

  $("#pty-connect").addEventListener("click", () => pty.connect());
  $("#latency-local").addEventListener("click", () => mountLatency("local"));
  $("#latency-pty").addEventListener("click", () => mountLatency("pty"));
  $("#latency-reset").addEventListener("click", () => latencyProbe?.reset());
  $("#board-static").addEventListener("click", () => void runBoard(false));
  $("#board-motion").addEventListener("click", () => void runBoard(true));
  $("#thr-run").addEventListener("click", () => void runThroughput());

  $("#copy-results").addEventListener("click", async () => {
    await navigator.clipboard.writeText(resultsMarkdown());
    const btn = $("#copy-results");
    btn.textContent = "copied";
    setTimeout(() => (btn.textContent = "copy as markdown"), 1200);
  });

  if (new URLSearchParams(location.search).has("token")) pty.connect();
}

boot();
