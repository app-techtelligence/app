"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { REVEAL_TRIGGER, shouldArm } from "@/lib/reveal";

// threshold 0 is mandatory: a 3000px section (the privacy policy) never reaches
// a fractional visibility ratio in a 700px viewport, and would stay hidden
// forever. The +9999px top margin disarms anything at or above the viewport
// immediately, so scroll restoration never strands a section invisible.
//
// The negative bottom margin is the trigger point, and it mirrors `shouldArm`
// by construction: a section is armed exactly when it has not reached this
// line, so nothing is ever hidden and revealed in the same breath.
const ROOT_MARGIN = `9999px 0px -${REVEAL_TRIGGER * 100}% 0px`;

// The bootstrap arms the first page before it paints. This has to beat the
// paint too, on every client-side navigation — hence a layout effect. The
// swap keeps React quiet during server rendering, where neither one runs.
const useArmEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * One observer for the whole page. Sections ship visible and server-rendered;
 * only JavaScript ever hides one, and only before it has been painted.
 */
export function RevealObserver() {
  // `next/navigation`, not `@/i18n/navigation`: the raw path carries the locale
  // prefix. The layout does not remount on client-side navigation, so without
  // this dependency the effect dies on the first internal link click.
  const pathname = usePathname();

  useArmEffect(() => {
    // Calls off the bootstrap's dead-man switch: the bundle is here.
    document.documentElement.setAttribute("data-reveal-live", "");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.removeAttribute("data-armed");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 },
    );

    const viewport = window.innerHeight;
    targets.forEach((el) => {
      // Anything the bootstrap already armed is left as it is: its rect now
      // carries the 16px offset of the hidden state, and re-measuring would
      // read a position the section does not really occupy.
      if (!el.hasAttribute("data-armed")) {
        if (!shouldArm(el.getBoundingClientRect(), viewport)) return;
        el.setAttribute("data-armed", "");
      }
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
