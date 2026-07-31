import { describe, expect, it } from "vitest";
import { REVEAL_TRIGGER, shouldArm } from "./reveal";

// The trigger line for an 800px viewport, so the cases below read as pixels.
const FOLD = 800 * (1 - REVEAL_TRIGGER);

describe("shouldArm", () => {
  it("leaves anything already past the trigger line alone", () => {
    expect(shouldArm({ top: 0, height: 600 }, 800)).toBe(false);
    expect(shouldArm({ top: FOLD - 1, height: 600 }, 800)).toBe(false);
    expect(shouldArm({ top: -1200, height: 600 }, 800)).toBe(false);
  });

  it("arms what is below the fold", () => {
    expect(shouldArm({ top: 1400, height: 600 }, 800)).toBe(true);
  });

  it("arms a section merely peeking at the bottom edge", () => {
    expect(shouldArm({ top: 780, height: 600 }, 800)).toBe(true);
  });

  it("arms an element resting exactly on the trigger line", () => {
    expect(shouldArm({ top: FOLD, height: 600 }, 800)).toBe(true);
  });

  it("skips zero-height elements", () => {
    expect(shouldArm({ top: 1400, height: 0 }, 800)).toBe(false);
  });

  it("skips everything when the viewport has no height", () => {
    expect(shouldArm({ top: 1400, height: 600 }, 0)).toBe(false);
  });
});
