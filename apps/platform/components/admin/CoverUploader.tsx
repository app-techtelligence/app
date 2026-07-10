"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/Button";

type Props = {
  postId: string;
  hasCover: boolean;
  labels: {
    upload: string;
    replace: string;
    uploading: string;
    done: string;
    error: string;
  };
};

type Status = "idle" | "uploading" | "done" | "error";

/** Single-shot cover upload (images are small; no multipart needed). */
export function CoverUploader({ postId, hasCover, labels }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  async function handleFile(file: File) {
    setStatus("uploading");
    try {
      const response = await fetch(
        `/api/admin/blog-cover?postId=${encodeURIComponent(postId)}`,
        {
          method: "POST",
          headers: { "content-type": file.type },
          body: file,
        },
      );
      if (!response.ok) throw new Error(String(response.status));
      setStatus("done");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={status === "uploading"}
        onClick={() => inputRef.current?.click()}
        className={buttonVariants("secondary", "md")}
      >
        {status === "uploading"
          ? labels.uploading
          : hasCover
            ? labels.replace
            : labels.upload}
      </button>
      {status === "done" ? (
        <span className="text-sm font-semibold text-emerald-700">{labels.done}</span>
      ) : null}
      {status === "error" ? (
        <span className="text-sm font-semibold text-red-700">{labels.error}</span>
      ) : null}
    </div>
  );
}
