/**
 * Client-side video compression for the admin lesson uploader.
 *
 * The Cloudflare Workers runtime can't run video codecs and "no added cost"
 * rules out any server/transcoding service, so compression happens in the
 * admin's browser via WebCodecs (the `mediabunny` library) BEFORE the existing
 * R2 multipart upload — the device's hardware H.264 encoder does the work for
 * free. See docs/video-delivery.md.
 *
 * INVARIANT: compression is a best-effort PRE-step. Every failure, skip, or
 * "didn't get smaller" path returns the untouched File, which the uploader
 * sends through today's exact path. Compression can never block or corrupt an
 * upload. `mediabunny` is imported dynamically so it is never evaluated during
 * SSR/build and only ships to the browser when an upload actually runs.
 */

import type { Input } from "mediabunny";

export type VideoPresetKey = "screen" | "talkinghead";

/** Mirrors the ffmpeg presets in docs/video-delivery.md §3. */
export const VIDEO_PRESETS: Record<
  VideoPresetKey,
  { maxW: number; maxH: number; videoBitrate: number }
> = {
  // Screen-share / code: keep resolution up to 1080p so text stays legible.
  screen: { maxW: 1920, maxH: 1080, videoBitrate: 2_200_000 },
  // Talking head: 720p is plenty and roughly halves the bitrate.
  talkinghead: { maxW: 1280, maxH: 720, videoBitrate: 1_300_000 },
};

const AUDIO_BITRATE = 128_000;
// Below this, compression isn't worth the effort/UX.
const MIN_SIZE_TO_COMPRESS = 25 * 1024 * 1024;
// Only keep the compressed output if it's meaningfully smaller.
const KEEP_IF_UNDER_RATIO = 0.9;
// Skip when the source is already at (or below) ~this multiple of the target
// bitrate — re-encoding a lean file just wastes time and can inflate it.
const ALREADY_LEAN_MARGIN = 1.15;

export type CompressPhase = "analyzing" | "compressing" | "uploading";

/**
 * - `compressed`   — a smaller re-encoded file is being uploaded.
 * - `original`     — the source was already lean / not worth it / didn't
 *                    shrink; the untouched file is uploaded.
 * - `unavailable`  — the browser can't compress (no WebCodecs/HW encoder) or
 *                    the transcode failed; the untouched file is uploaded.
 */
export type CompressNote = "compressed" | "original" | "unavailable";

export type PreparedUpload = {
  /** What the uploader should send: the raw File or the compressed Blob. */
  body: Blob;
  durationSeconds: number | null;
  note: CompressNote;
  originalSize: number;
  finalSize: number;
};

export type PrepareOptions = {
  onPhase?: (phase: CompressPhase) => void;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
};

/** Thrown only when the admin cancels — the uploader aborts entirely. */
export class CompressCanceledError extends Error {
  constructor() {
    super("compression canceled");
    this.name = "CompressCanceledError";
  }
}

// ---- pure helpers (unit-tested) ----

function makeEven(n: number): number {
  const floored = Math.floor(n);
  return Math.max(2, floored - (floored % 2));
}

/**
 * Target dimensions that fit within the preset box, preserve aspect ratio,
 * never upscale, and are even (H.264 4:2:0 requires even width/height).
 */
export function computeTargetDims(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  if (!(srcW > 0) || !(srcH > 0)) return { width: maxW, height: maxH };
  const scale = Math.min(1, maxW / srcW, maxH / srcH);
  return { width: makeEven(srcW * scale), height: makeEven(srcH * scale) };
}

/**
 * Whether a source is worth compressing: big enough, and encoded above the
 * target bitrate (so re-encoding will actually shrink it). Unknown duration →
 * attempt, and let the size-comparison gate decide afterwards.
 */
export function shouldCompressBySize(
  fileSize: number,
  durationSeconds: number | null,
  targetVideoBitrate: number,
): boolean {
  if (fileSize < MIN_SIZE_TO_COMPRESS) return false;
  if (!durationSeconds || durationSeconds <= 0) return true;
  const sourceBitrate = (fileSize * 8) / durationSeconds;
  return sourceBitrate > targetVideoBitrate * ALREADY_LEAN_MARGIN;
}

/** True if the buffer begins with an MP4 `ftyp` box (bytes 4..8 = "ftyp"). */
export function bytesStartWithFtyp(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 12) return false;
  const b = new Uint8Array(buffer, 4, 4);
  return b[0] === 0x66 && b[1] === 0x74 && b[2] === 0x79 && b[3] === 0x70;
}

// ---- orchestrator ----

export async function prepareUpload(
  file: File,
  presetKey: VideoPresetKey,
  opts: PrepareOptions = {},
): Promise<PreparedUpload> {
  const preset = VIDEO_PRESETS[presetKey];
  const raw = (note: CompressNote, duration: number | null): PreparedUpload => ({
    body: file,
    durationSeconds: duration,
    note,
    originalSize: file.size,
    finalSize: file.size,
  });

  opts.onPhase?.("analyzing");

  let MB: typeof import("mediabunny");
  try {
    MB = await import("mediabunny");
  } catch {
    return raw("unavailable", null);
  }

  // Probe the source: dimensions, whether it has audio, and — crucially — the
  // duration. mediabunny reads the File bytes directly (no <video>, no blob:
  // URL), so it fixes the blank-duration bug that the CSP `media-src 'self'`
  // caused for the old readDuration() on BOTH the raw and compressed paths.
  let input: Input | null = null;
  let durationSeconds: number | null = null;
  let srcW = 0;
  let srcH = 0;
  let hasAudio = false;
  try {
    input = new MB.Input({ source: new MB.BlobSource(file), formats: MB.ALL_FORMATS });
    const videoTrack = await input.getPrimaryVideoTrack();
    if (videoTrack) {
      srcW = videoTrack.displayWidth;
      srcH = videoTrack.displayHeight;
    }
    hasAudio = (await input.getPrimaryAudioTrack()) !== null;
    try {
      durationSeconds = Math.round(await input.computeDuration());
    } catch {
      durationSeconds = null;
    }
  } catch {
    input?.dispose();
    return raw("unavailable", null);
  }

  const bail = (note: CompressNote): PreparedUpload => {
    input?.dispose();
    return raw(note, durationSeconds);
  };

  if (!srcW || !srcH) return bail("original"); // no video track to compress

  const { width, height } = computeTargetDims(srcW, srcH, preset.maxW, preset.maxH);

  // Feature gate — feature-detect before doing any work. (canEncode returning
  // true still doesn't guarantee runtime success, hence the try/catch below.)
  let canVideo = false;
  let canAudio = false;
  try {
    canVideo =
      typeof VideoEncoder !== "undefined" &&
      (await MB.getFirstEncodableVideoCodec(["avc"], {
        width,
        height,
        bitrate: preset.videoBitrate,
      })) !== null;
    canAudio = !hasAudio || (await MB.canEncodeAudio("aac", { bitrate: AUDIO_BITRATE }));
  } catch {
    canVideo = false;
  }
  if (!canVideo || !canAudio) return bail("unavailable");

  if (!shouldCompressBySize(file.size, durationSeconds, preset.videoBitrate)) {
    return bail("original");
  }

  // Transcode.
  opts.onPhase?.("compressing");
  opts.onProgress?.(0);
  const target = new MB.BufferTarget();
  const output = new MB.Output({
    format: new MB.Mp4OutputFormat({ fastStart: "in-memory" }), // moov at front
    target,
  });

  let conversion: Awaited<ReturnType<typeof MB.Conversion.init>>;
  try {
    conversion = await MB.Conversion.init({
      input,
      output,
      video: { codec: "avc", width, height, fit: "contain", bitrate: preset.videoBitrate },
      audio: hasAudio ? { codec: "aac", bitrate: AUDIO_BITRATE } : { discard: true },
      showWarnings: false,
    });
  } catch {
    return bail("unavailable");
  }

  conversion.onProgress = (p) => opts.onProgress?.(Math.min(100, Math.round(p * 100)));
  const onAbort = () => void conversion.cancel().catch(() => {});
  opts.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    await conversion.execute();
  } catch {
    opts.signal?.removeEventListener("abort", onAbort);
    input.dispose();
    if (opts.signal?.aborted) throw new CompressCanceledError();
    return raw("unavailable", durationSeconds);
  }
  opts.signal?.removeEventListener("abort", onAbort);

  // Never ship a silently-muted video: if the source had audio but it was
  // dropped, fall back to the original.
  const audioDropped =
    hasAudio && conversion.discardedTracks.some((d) => d.track.type === "audio");
  const buffer = target.buffer;
  input.dispose();

  if (
    audioDropped ||
    !buffer ||
    buffer.byteLength === 0 ||
    !bytesStartWithFtyp(buffer) ||
    buffer.byteLength >= file.size * KEEP_IF_UNDER_RATIO
  ) {
    return raw("original", durationSeconds);
  }

  return {
    body: new Blob([buffer], { type: "video/mp4" }),
    durationSeconds,
    note: "compressed",
    originalSize: file.size,
    finalSize: buffer.byteLength,
  };
}
