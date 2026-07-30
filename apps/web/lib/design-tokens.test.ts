import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./color";

const webCss = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
);
const platformCss = readFileSync(
  fileURLToPath(
    new URL("../../platform/app/globals.css", import.meta.url),
  ),
  "utf8",
);

function token(css: string, name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!match) throw new Error(`--color-${name} is not defined`);
  return match[1];
}

describe("brand tokens", () => {
  it("defines signal in both apps with the same value", () => {
    expect(token(webCss, "signal").toLowerCase()).toBe("#5ac8e0");
    expect(token(platformCss, "signal").toLowerCase()).toBe("#5ac8e0");
  });

  /**
   * Spec §2.1: signal is legible on navy and illegible on white. The rule
   * "only on navy, only as light" is derived from these two numbers, so the
   * numbers are asserted rather than trusted.
   */
  it("keeps signal AA on navy and proves it fails on white", () => {
    const signal = token(webCss, "signal");
    expect(contrastRatio(signal, token(webCss, "navy"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(signal, "#FFFFFF")).toBeLessThan(3);
  });

  it("keeps the existing text tokens AA on their own surfaces", () => {
    expect(contrastRatio(token(webCss, "steel"), "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(token(webCss, "steel-light"), token(webCss, "navy")),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe("signal usage rule", () => {
  const appRoot = fileURLToPath(new URL("..", import.meta.url));

  it("never uses signal as a background fill", () => {
    const offenders = sourceFiles(appRoot).filter((file) =>
      /\bbg-signal\b/.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("never puts signal in the Button variants", () => {
    const button = readFileSync(join(appRoot, "components/ui/Button.tsx"), "utf8");
    expect(button).not.toMatch(/signal/);
  });
});
