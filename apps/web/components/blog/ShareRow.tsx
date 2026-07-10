"use client";

import { useState } from "react";
import { CheckIcon, LinkIcon, LinkedInIcon, XLogoIcon } from "@/components/ui/icons";

type Props = {
  url: string;
  title: string;
  labels: {
    share: string;
    linkedin: string;
    x: string;
    copy: string;
    copied: string;
  };
};

const itemCls =
  "flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white";

export function ShareRow({ url, title, labels }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (old browser / permissions) — no-op.
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-steel">
        {labels.share}
      </span>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.linkedin}
        className={itemCls}
      >
        <LinkedInIcon className="h-4 w-4" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.x}
        className={itemCls}
      >
        <XLogoIcon className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={copyLink}
        aria-label={labels.copy}
        title={copied ? labels.copied : labels.copy}
        className={itemCls}
      >
        {copied ? <CheckIcon className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
      </button>
      <span aria-live="polite" className="text-xs font-semibold text-emerald-700">
        {copied ? labels.copied : ""}
      </span>
    </div>
  );
}
