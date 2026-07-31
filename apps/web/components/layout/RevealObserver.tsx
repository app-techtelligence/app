"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { shouldArm } from "@/lib/reveal";

// threshold 0 is mandatory: a 3000px section (the privacy policy) never reaches
// a fractional visibility ratio in a 700px viewport, and would stay hidden
// forever. The +9999px top margin disarms anything at or above the viewport
// immediately, so scroll restoration never strands a section invisible.
//
// The negative bottom margin is the trigger point, tuned by eye: a section has
// to climb 15% of the viewport past the bottom edge before it reveals. Larger
// fires later. It cannot strand anything — the shortest possible gap below an
// armed section is its own height plus the footer, always over 15% of a viewport.
const ROOT_MARGIN = "9999px 0px -15% 0px";

/**
 * One observer for the whole page. Sections ship visible and server-rendered;
 * this only hides the ones still below the fold, then reveals them on approach.
 */
export function RevealObserver() {
  // `next/navigation`, not `@/i18n/navigation`: the raw path carries the locale
  // prefix. The layout does not remount on client-side navigation, so without
  // this dependency the effect dies on the first internal link click.
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // Empty value, not removeAttribute: the base `[data-reveal]` rule
          // carries the transition, and dropping it would kill the animation.
          entry.target.setAttribute("data-reveal", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );

    const viewport = window.innerHeight;
    targets.forEach((el) => {
      if (!shouldArm(el.getBoundingClientRect(), viewport)) return;
      el.dataset.reveal = "armed";
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
