/** Frame-time and latency statistics. Shared by every probe so the numbers are comparable. */

export interface Stats {
  n: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  mean: number;
}

export function summarize(samples: number[]): Stats {
  if (samples.length === 0) return { n: 0, p50: 0, p95: 0, p99: 0, max: 0, mean: 0 };
  const s = [...samples].sort((a, b) => a - b);
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))]!;
  return {
    n: s.length,
    p50: at(0.5),
    p95: at(0.95),
    p99: at(0.99),
    max: s[s.length - 1]!,
    mean: s.reduce((a, b) => a + b, 0) / s.length,
  };
}

export const ms = (v: number): string => `${v.toFixed(1)} ms`;

/**
 * Collect frame-to-frame deltas for `seconds`, optionally calling `onFrame` so a probe
 * can drive an animation while being measured.
 *
 * The first frame is discarded: it carries the cost of whatever set the probe up, which
 * is not what we are trying to measure.
 */
export function recordFrames(
  seconds: number,
  onFrame?: (t: number) => void,
): Promise<number[]> {
  return new Promise((resolve) => {
    const deltas: number[] = [];
    let last = performance.now();
    const start = last;
    let first = true;

    const tick = (now: number) => {
      if (first) {
        first = false;
      } else {
        deltas.push(now - last);
      }
      last = now;
      onFrame?.((now - start) / 1000);
      if (now - start < seconds * 1000) requestAnimationFrame(tick);
      else resolve(deltas);
    };
    requestAnimationFrame(tick);
  });
}

/** Effective frames per second implied by the median frame time. */
export function fpsFrom(stats: Stats): number {
  return stats.p50 > 0 ? 1000 / stats.p50 : 0;
}
