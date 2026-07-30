/** WCAG 2.1 sRGB contrast math. Pure — no DOM, no dependencies. */

function expand(hex: string): string {
  const raw = hex.replace("#", "");
  return raw.length === 3
    ? raw
        .split("")
        .map((c) => c + c)
        .join("")
    : raw;
}

/** Undo the sRGB transfer function for one 0–255 channel. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = expand(hex);
  const r = linearize(parseInt(rgb.slice(0, 2), 16));
  const g = linearize(parseInt(rgb.slice(2, 4), 16));
  const b = linearize(parseInt(rgb.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
