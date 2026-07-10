"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  name: string;
  label: string;
  defaultValue: string;
  writeLabel: string;
  previewLabel: string;
};

/**
 * Markdown textarea with a write/preview toggle. Controlled so the preview
 * always reflects the current draft; the textarea stays in the form (hidden
 * during preview) so the value still posts with the surrounding <form>.
 */
export function MarkdownField({ name, label, defaultValue, writeLabel, previewLabel }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  const tabCls = (active: boolean) =>
    `rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
      active ? "bg-navy text-white" : "bg-navy/5 text-steel hover:text-navy"
    }`;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="block text-xs font-bold text-navy">{label}</span>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setPreview(false)} className={tabCls(!preview)}>
            {writeLabel}
          </button>
          <button type="button" onClick={() => setPreview(true)} className={tabCls(preview)}>
            {previewLabel}
          </button>
        </div>
      </div>

      <textarea
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={14}
        className={`w-full rounded-md border border-navy/20 bg-white px-3 py-2 font-mono text-sm text-navy focus:border-navy ${
          preview ? "hidden" : ""
        }`}
      />

      {preview ? (
        <div className="min-h-[21rem] space-y-3 rounded-md border border-navy/10 bg-canvas px-4 py-3 text-sm leading-relaxed text-navy [&_a]:font-semibold [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:text-steel [&_code]:rounded [&_code]:bg-navy/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-extrabold [&_h3]:mt-3 [&_h3]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-navy [&_pre]:p-3 [&_pre]:text-white [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  );
}
