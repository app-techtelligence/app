"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
  savingLabel: string;
  savedLabel: string;
  className?: string;
  children: ReactNode;
};

/**
 * Wraps a save-type server-action form and flashes a snackbar
 * ("Saving…" → "✓ Changes saved") when the action completes. Only for
 * actions that stay on the page — redirecting actions (create-and-open,
 * delete-and-leave) already get their feedback from the navigation.
 */
export function SaveForm({ action, savingLabel, savedLabel, className, children }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <form
      className={className}
      action={async (formData) => {
        clearTimeout(timer.current);
        setStatus("saving");
        try {
          await action(formData);
          setStatus("saved");
          timer.current = setTimeout(() => setStatus("idle"), 2500);
        } catch (error) {
          // Actions fail silently by design (see admin-actions.ts); a rejected
          // promise here is a transport error, not a validation failure.
          console.error("save failed:", error);
          setStatus("idle");
        }
      }}
    >
      {children}
      {status !== "idle" ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          {status === "saving" ? (
            savingLabel
          ) : (
            <>
              <span aria-hidden="true" className="text-accent">✓</span>
              {savedLabel}
            </>
          )}
        </div>
      ) : null}
    </form>
  );
}
