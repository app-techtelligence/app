import { describe, expect, it } from "vitest";
import { shouldArm } from "./reveal";

describe("shouldArm", () => {
  it("leaves anything already on screen alone", () => {
    expect(shouldArm({ top: 0, height: 600 }, 800)).toBe(false);
    expect(shouldArm({ top: 799, height: 600 }, 800)).toBe(false);
    expect(shouldArm({ top: -1200, height: 600 }, 800)).toBe(false);
  });

  it("arms what is below the fold", () => {
    expect(shouldArm({ top: 1400, height: 600 }, 800)).toBe(true);
  });

  it("arms an element resting exactly on the fold", () => {
    expect(shouldArm({ top: 800, height: 600 }, 800)).toBe(true);
  });

  it("skips zero-height elements", () => {
    expect(shouldArm({ top: 1400, height: 0 }, 800)).toBe(false);
  });

  it("skips everything when the viewport has no height", () => {
    expect(shouldArm({ top: 1400, height: 600 }, 0)).toBe(false);
  });
});
