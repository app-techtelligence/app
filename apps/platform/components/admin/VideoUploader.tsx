"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  CompressCanceledError,
  prepareUpload,
  type CompressNote,
  type VideoPresetKey,
} from "@/lib/video-compress";

export type UploaderLabels = {
  upload: string;
  replace: string;
  uploading: string;
  done: string;
  error: string;
  analyzing: string;
  compressing: string;
  compressed: string;
  optimizedOriginal: string;
  compressUnavailable: string;
  cancel: string;
  presetLabel: string;
  presetTalkingHead: string;
  presetScreenShare: string;
};

const CHUNK = 32 * 1024 * 1024; // uniform part size (last part may be smaller)

function formatMB(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

type Phase = "idle" | "analyzing" | "compressing" | "uploading" | "done" | "error";

export function VideoUploader({
  lessonId,
  hasVideo,
  labels,
}: {
  lessonId: string;
  hasVideo: boolean;
  labels: UploaderLabels;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [preset, setPreset] = useState<VideoPresetKey>("screen");
  const [outcome, setOutcome] = useState<
    { note: CompressNote; from: string; to: string } | null
  >(null);

  const busy = phase === "analyzing" || phase === "compressing" || phase === "uploading";

  // Guard against losing a long compress/upload to an accidental tab close.
  useEffect(() => {
    if (!busy) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [busy]);

  async function handleFile(file: File) {
    setOutcome(null);
    const controller = new AbortController();
    abortRef.current = controller;
    let createdKey: string | null = null;
    let createdUploadId: string | null = null;

    try {
      // 1. Compress in the browser (best-effort; returns the raw file on any
      //    skip/failure — see lib/video-compress.ts).
      const prepared = await prepareUpload(file, preset, {
        onPhase: setPhase,
        onProgress: setProgress,
        signal: controller.signal,
      });
      const body = prepared.body;

      // 2. Upload whatever we ended up with (raw File or compressed Blob) via
      //    the unchanged R2 multipart route — it only needs .size/.slice().
      setPhase("uploading");
      setProgress(0);

      const createRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "create", lessonId }),
      });
      if (!createRes.ok) throw new Error("create failed");
      const { key, uploadId } = (await createRes.json()) as {
        key: string;
        uploadId: string;
      };
      createdKey = key;
      createdUploadId = uploadId;

      const parts: { partNumber: number; etag: string }[] = [];
      const total = Math.ceil(body.size / CHUNK);
      for (let i = 0; i < total; i++) {
        if (controller.signal.aborted) throw new CompressCanceledError();
        const chunk = body.slice(i * CHUNK, Math.min((i + 1) * CHUNK, body.size));
        const partRes = await fetch(
          `/api/admin/upload?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&part=${i + 1}`,
          { method: "PUT", body: chunk },
        );
        if (!partRes.ok) throw new Error(`part ${i + 1} failed`);
        parts.push((await partRes.json()) as { partNumber: number; etag: string });
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      const completeRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          op: "complete",
          lessonId,
          key,
          uploadId,
          parts,
          durationSeconds: prepared.durationSeconds,
        }),
      });
      if (!completeRes.ok) throw new Error("complete failed");

      setOutcome({
        note: prepared.note,
        from: formatMB(prepared.originalSize),
        to: formatMB(prepared.finalSize),
      });
      setPhase("done");
      router.refresh();
    } catch (error) {
      if (createdKey && createdUploadId) {
        fetch("/api/admin/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ op: "abort", key: createdKey, uploadId: createdUploadId }),
        }).catch(() => undefined);
      }
      // A cancel is not an error — just return to idle.
      setPhase(error instanceof CompressCanceledError ? "idle" : "error");
      setProgress(0);
    } finally {
      abortRef.current = null;
    }
  }

  function statusText(): string {
    if (phase === "analyzing") return labels.analyzing;
    if (phase === "compressing") return `${labels.compressing} ${progress}%`;
    if (phase === "uploading") return `${labels.uploading} ${progress}%`;
    return "";
  }

  function outcomeText(): string {
    if (!outcome) return labels.done;
    if (outcome.note === "compressed") {
      return `${labels.compressed} ${outcome.from} → ${outcome.to}`;
    }
    return outcome.note === "unavailable"
      ? labels.compressUnavailable
      : labels.optimizedOriginal;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        {!busy ? (
          <label className="flex items-center gap-2 text-xs font-semibold text-steel">
            {labels.presetLabel}
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as VideoPresetKey)}
              className="rounded-md border border-navy/20 bg-white px-2 py-1 text-xs font-semibold text-navy focus:border-navy"
            >
              <option value="screen">{labels.presetScreenShare}</option>
              <option value="talkinghead">{labels.presetTalkingHead}</option>
            </select>
          </label>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-navy/25 px-3 py-1.5 text-xs font-bold text-navy transition-colors hover:border-navy hover:bg-canvas disabled:opacity-60"
        >
          {busy ? statusText() : hasVideo ? labels.replace : labels.upload}
        </button>

        {busy ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="rounded-md px-2 py-1 text-xs font-semibold text-steel transition-colors hover:bg-navy/5 hover:text-navy"
          >
            {labels.cancel}
          </button>
        ) : null}

        {phase === "done" ? (
          <span className="text-xs font-bold text-emerald-700">{outcomeText()}</span>
        ) : null}
        {phase === "error" ? (
          <span className="text-xs font-bold text-red-700">{labels.error}</span>
        ) : null}
      </div>

      {phase === "compressing" || phase === "uploading" ? (
        <span className="h-1.5 w-40 overflow-hidden rounded-full bg-navy/10">
          <span
            className="block h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </span>
      ) : null}
    </div>
  );
}
