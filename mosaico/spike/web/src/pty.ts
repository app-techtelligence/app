/** Thin client for the spike's PTY bridge (see ../../pty). Throwaway. */

export type PtyStatus = "disconnected" | "connecting" | "connected" | "error";

export class PtyLink {
  private ws: WebSocket | null = null;
  onData: ((data: Uint8Array) => void) | null = null;
  onStatus: ((status: PtyStatus, detail?: string) => void) | null = null;

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * The bridge serves the built page itself, and the vite dev server proxies /ws to it,
   * so the same relative URL works in both. The token comes from the query string the
   * bridge printed at startup.
   */
  static url(): string {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const token = new URLSearchParams(location.search).get("token") ?? "";
    return `${proto}//${location.host}/ws?token=${encodeURIComponent(token)}`;
  }

  connect(url = PtyLink.url()): void {
    this.close();
    this.onStatus?.("connecting");
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => this.onStatus?.("connected");
    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) this.onData?.(new Uint8Array(e.data));
    };
    ws.onerror = () =>
      this.onStatus?.(
        "error",
        "could not connect — is the bridge running, and does the URL carry its ?token=?",
      );
    ws.onclose = () => this.onStatus?.("disconnected");
    this.ws = ws;
  }

  /** Raw PTY input. Binary frames, never text — the shell gets exactly these bytes. */
  send(data: string): void {
    if (this.connected) this.ws!.send(new TextEncoder().encode(data));
  }

  /** Control messages are the one thing sent as text frames. */
  resize(cols: number, rows: number): void {
    if (this.connected) this.ws!.send(JSON.stringify({ t: "resize", cols, rows }));
  }

  /** Ask the bridge to run its payload generator inside the PTY. */
  bench(mb: number): void {
    if (this.connected) this.ws!.send(JSON.stringify({ t: "bench", mb }));
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }
}
