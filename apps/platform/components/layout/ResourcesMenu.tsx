"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronDownIcon } from "@/components/ui/icons";

/**
 * "Recursos" / "Resources" dropdown next to the logo — the door to student
 * resources beyond the courses. It will grow more items over time. This is a
 * disclosure (button + list of links), not an ARIA menu — links stay plain
 * Tab targets, so no roving-focus keyboard pattern is owed.
 */
export function ResourcesMenu() {
  const t = useTranslations("common.resources");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        // Don't strand keyboard focus on <body> when the panel unmounts.
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-sm font-semibold text-navy/75 transition-colors hover:text-navy sm:px-2"
      >
        {t("label")}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-full mt-2 w-60 rounded-xl border border-navy/10 bg-white p-1.5 shadow-lg">
          <Link
            href="/job-tracker"
            onClick={() => setOpen(false)}
            className={`block rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              pathname === "/job-tracker"
                ? "bg-navy/5 text-navy"
                : "text-navy/75 hover:bg-canvas hover:text-navy"
            }`}
          >
            {t("jobTracker")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
