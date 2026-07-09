"use client";

import { useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";

export type UploaderLabels = {
  upload: string;
  replace: string;
  uploading: string;
  done: string;
  error: string;
};

const CHUNK = 32 * 1024 * 1024; // uniform part size (last part may be smaller)

/** Reads the video duration from the local file before uploading. */
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : null);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    video.src = url;
  });
}

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
  const [progress, setProgress] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");

  async function handleFile(file: File) {
    setState("uploading");
    setProgress(0);
    let createdKey: string | null = null;
    let createdUploadId: string | null = null;

    try {
      const durationSeconds = await readDuration(file);

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
      const total = Math.ceil(file.size / CHUNK);
      for (let i = 0; i < total; i++) {
        const chunk = file.slice(i * CHUNK, Math.min((i + 1) * CHUNK, file.size));
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
          durationSeconds,
        }),
      });
      if (!completeRes.ok) throw new Error("complete failed");

      setState("done");
      router.refresh();
    } catch {
      if (createdKey && createdUploadId) {
        fetch("/api/admin/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ op: "abort", key: createdKey, uploadId: createdUploadId }),
        }).catch(() => undefined);
      }
      setState("error");
      setProgress(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
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
      <button
        type="button"
        disabled={state === "uploading"}
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-navy/25 px-3 py-1.5 text-xs font-bold text-navy transition-colors hover:border-navy hover:bg-canvas disabled:opacity-60"
      >
        {state === "uploading"
          ? `${labels.uploading} ${progress ?? 0}%`
          : hasVideo
            ? labels.replace
            : labels.upload}
      </button>
      {state === "uploading" ? (
        <span className="h-1.5 w-28 overflow-hidden rounded-full bg-navy/10">
          <span
            className="block h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress ?? 0}%` }}
          />
        </span>
      ) : null}
      {state === "done" ? (
        <span className="text-xs font-bold text-emerald-700">{labels.done}</span>
      ) : null}
      {state === "error" ? (
        <span className="text-xs font-bold text-red-700">{labels.error}</span>
      ) : null}
    </div>
  );
}
