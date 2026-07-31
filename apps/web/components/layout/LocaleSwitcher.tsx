"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import { localeSwitchHref } from "@/lib/locale-switch";

/**
 * Endonyms — each language written in itself, so a visitor who cannot read the
 * current locale still recognises their own. Deliberately outside
 * messages/*.json: these two strings must never be translated.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português",
  en: "English",
};

/**
 * Resolves the active locale against the declared ones. `useLocale()` is typed
 * as a plain string; this narrows it to `Locale` without a cast.
 */
export function useActiveLocale(): Locale {
  const locale = useLocale();
  return routing.locales.find((l) => l === locale) ?? routing.defaultLocale;
}

/** Language dropdown — shown from `md` up; below that it lives in MobileNav. */
export function LocaleSwitcher() {
  const t = useTranslations("common.localeSwitcher");
  const href = localeSwitchHref(usePathname());
  const active = useActiveLocale();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // The listeners exist only while the panel is open, so a closed switcher
  // costs nothing on every document click.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Escape must not strand focus on a panel that no longer exists.
      triggerRef.current?.focus();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <nav aria-label={t("label")} className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-navy/15 px-3 py-1.5 text-sm font-semibold text-navy/75 transition-colors hover:border-navy/25 hover:text-navy"
      >
        {LOCALE_LABELS[active]}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-navy/5 bg-white p-2 shadow-lg shadow-navy/10 motion-safe:animate-fade-in"
        >
          {routing.locales.map((candidate) =>
            candidate === active ? (
              // The active locale is not a link: on post pages `href` falls
              // back to the listing, so clicking "current" would navigate away.
              <span
                key={candidate}
                aria-current="true"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-navy"
              >
                <span className="flex-1">{LOCALE_LABELS[candidate]}</span>
                <CheckIcon className="h-4 w-4" />
              </span>
            ) : (
              <Link
                key={candidate}
                href={href}
                locale={candidate}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-navy/80 transition-colors hover:bg-canvas hover:text-navy"
              >
                {LOCALE_LABELS[candidate]}
              </Link>
            ),
          )}
        </div>
      ) : null}
    </nav>
  );
}
