import { describe, expect, it } from "vitest";
import {
  bytesStartWithFtyp,
  computeTargetDims,
  shouldCompressBySize,
  VIDEO_PRESETS,
} from "./video-compress";

describe("computeTargetDims", () => {
  it("caps a 1080p source to the screen box unchanged (no upscale needed)", () => {
    expect(computeTargetDims(1920, 1080, 1920, 1080)).toEqual({ width: 1920, height: 1080 });
  });

  it("downscales 1080p to the 720p talking-head box, preserving 16:9", () => {
    expect(computeTargetDims(1920, 1080, 1280, 720)).toEqual({ width: 1280, height: 720 });
  });

  it("never upscales a small source", () => {
    expect(computeTargetDims(640, 360, 1920, 1080)).toEqual({ width: 640, height: 360 });
  });

  it("preserves aspect and fits a portrait source within the box", () => {
    // 1080x1920 into a 1920x1080 box → limited by height (0.5625×):
    // 1080×0.5625 = 607.5 → floored to even = 606.
    expect(computeTargetDims(1080, 1920, 1920, 1080)).toEqual({ width: 606, height: 1080 });
  });

  it("always returns even dimensions (H.264 4:2:0 requirement)", () => {
    const { width, height } = computeTargetDims(1921, 1081, 1280, 720);
    expect(width % 2).toBe(0);
    expect(height % 2).toBe(0);
  });

  it("falls back to the box for a degenerate source", () => {
    expect(computeTargetDims(0, 0, 1280, 720)).toEqual({ width: 1280, height: 720 });
  });
});

describe("shouldCompressBySize", () => {
  const { videoBitrate } = VIDEO_PRESETS.screen; // 2.2 Mbps

  it("skips files under 25 MB", () => {
    expect(shouldCompressBySize(10 * 1024 * 1024, 600, videoBitrate)).toBe(false);
  });

  it("skips an already-lean source (the ~1.1 Mbps seed)", () => {
    // 168 MB over 1649 s ≈ 0.85 Mbps, well under the 2.2 Mbps target.
    expect(shouldCompressBySize(168 * 1024 * 1024, 1649, videoBitrate)).toBe(false);
  });

  it("compresses a fat raw screen capture (~12 Mbps)", () => {
    // 900 MB over 600 s ≈ 12.6 Mbps.
    expect(shouldCompressBySize(900 * 1024 * 1024, 600, videoBitrate)).toBe(true);
  });

  it("attempts when duration is unknown (size gate only)", () => {
    expect(shouldCompressBySize(100 * 1024 * 1024, null, videoBitrate)).toBe(true);
  });
});

describe("bytesStartWithFtyp", () => {
  function withFtyp(): ArrayBuffer {
    const buf = new Uint8Array(16);
    buf.set([0x66, 0x74, 0x79, 0x70], 4); // "ftyp" at offset 4
    return buf.buffer;
  }

  it("accepts a buffer whose box type is ftyp", () => {
    expect(bytesStartWithFtyp(withFtyp())).toBe(true);
  });

  it("rejects a non-MP4 / too-short buffer", () => {
    expect(bytesStartWithFtyp(new Uint8Array([1, 2, 3, 4]).buffer)).toBe(false);
    expect(bytesStartWithFtyp(new Uint8Array(16).buffer)).toBe(false);
  });
});
