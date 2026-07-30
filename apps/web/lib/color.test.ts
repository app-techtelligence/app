import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "./color";

describe("relativeLuminance", () => {
  it("anchors at the sRGB extremes", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("accepts shorthand and lowercase hex", () => {
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#1a2a44")).toBeCloseTo(
      relativeLuminance("#1A2A44"),
      10,
    );
  });
});

describe("contrastRatio", () => {
  it("returns 21 for black on white, in either order", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  // Spec §2.1 — these two numbers are the entire justification for the
  // "signal only on navy" rule. If they ever change, the rule needs rewriting.
  it("matches the spec's measured pairs for signal", () => {
    expect(contrastRatio("#5AC8E0", "#1A2A44")).toBeCloseTo(7.39, 1);
    expect(contrastRatio("#5AC8E0", "#FFFFFF")).toBeCloseTo(1.95, 2);
  });

  it("confirms steel is AA on white", () => {
    expect(contrastRatio("#667080", "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
});
