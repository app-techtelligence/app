"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

export type UserMenuLabels = {
  accountMenu: string;
  changePassword: string;
  logout: string;
};

export function UserMenu({
  initials,
  name,
  email,
  labels,
  signOutAction,
}: {
  initials: string;
  name: string | null;
  email: string;
  labels: UserMenuLabels;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
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
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={labels.accountMenu}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-white transition-shadow hover:ring-2 hover:ring-navy/25 ${
          open ? "ring-2 ring-navy/25" : ""
        }`}
      >
        {initials}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-lg border border-navy/10 bg-white shadow-lg">
          <div className="border-b border-navy/10 px-4 py-3">
            {name ? (
              <p className="truncate text-sm font-semibold text-navy">{name}</p>
            ) : null}
            <p className="truncate text-xs text-steel">{email}</p>
          </div>
          <Link
            href="/change-password"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-navy/75 transition-colors hover:bg-canvas hover:text-navy"
          >
            {labels.changePassword}
          </Link>
          <form action={signOutAction} className="border-t border-navy/10">
            <button
              type="submit"
              className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-navy/75 transition-colors hover:bg-canvas hover:text-navy"
            >
              {labels.logout}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
