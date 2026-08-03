"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CloseIcon } from "@/components/ui/icons";

export type ChatPanelProps = { onClose: () => void };

export function ChatPanel({ onClose }: ChatPanelProps) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={t("a11y.panel")}
      lang={locale}
      className="fixed inset-x-0 bottom-0 z-50 flex h-[85svh] flex-col overflow-hidden rounded-t-2xl border border-navy/10 bg-white shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:max-h-[80svh] sm:w-[380px] sm:rounded-2xl"
    >
      <header className="flex items-center justify-between bg-navy px-4 py-3 text-white">
        <div>
          <p className="text-sm font-extrabold tracking-wide">{t("title")}</p>
          <p className="text-xs text-steel-light">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("launcher.close")}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>
      {/* Corpo real (mensagens, chips, input, desfechos) entra na Task 10 */}
      <div className="flex-1 overflow-y-auto p-4 text-sm text-navy">{t("welcome")}</div>
    </div>
  );
}
