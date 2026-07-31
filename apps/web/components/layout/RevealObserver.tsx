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
// by construction. Only blocks short of that line are ever handed to the
// observer — the ones already past it enter on their own two frames later —
// so nothing is hidden and revealed in the same breath.
const ROOT_MARGIN = `9999px 0px -${REVEAL_TRIGGER * 100}% 0px`;

// The bootstrap arms the first page before it paints. This has to beat the
// paint too, on every client-side navigation — hence a layout effect. The
// swap keeps React quiet during server rendering, where neither one runs.
const useArmEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * One observer for the whole page, and the entrance animation for every page
 * this one navigates to. Blocks ship visible and server-rendered; only
 * JavaScript ever hides one, and only before it has been painted.
 */
export function RevealObserver() {
  // `next/navigation`, not `@/i18n/navigation`: the raw path carries the locale
  // prefix. The layout does not remount on client-side navigation, so without
  // this dependency the effect dies on the first internal link click.
  const pathname = usePathname();

  useArmEffect(() => {
    // The inline bootstrap owns the entrance for the document it was parsed
    // into, and this attribute is how that document is told apart: it is
    // missing exactly once, on this effect's first run. Every later run is a
    // client-side navigation, where nothing at all ran before the paint except
    // this effect — so the entrance is ours to play.
    const html = document.documentElement;
    const bootstrapped = !html.hasAttribute("data-reveal-live");
    // Setting it also calls off the bootstrap's dead-man switch: bundle is here.
    html.setAttribute("data-reveal-live", "");

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
    // Hidden here only to be let go two frames from now: the entrance.
    const entering: HTMLElement[] = [];

    targets.forEach((el) => {
      if (el.hasAttribute("data-armed")) {
        // Already hidden by the bootstrap, which also scheduled its release.
        // Re-measuring would read the hidden state's downward offset, a
        // position the block does not really occupy.
        observer.observe(el);
        return;
      }
      // On the first run an unarmed block is one the bootstrap deliberately
      // let through, and its entrance is already under way. Touching it would
      // play the animation a second time.
      if (bootstrapped) return;

      const rect = el.getBoundingClientRect();
      if (rect.height <= 0) return;
      el.setAttribute("data-armed", "");
      if (shouldArm(rect, viewport)) {
        observer.observe(el);
      } else {
        // Never observed: it is on screen already, and the frames below are
        // the only thing it is waiting for.
        entering.push(el);
      }
    });

    // Two frames so the hidden state gets painted once — a transition animates
    // away from the last rendered style, and a single frame would swap it
    // before the browser drew anything.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        for (const el of entering) el.removeAttribute("data-armed");
      });
    });

    return () => {
      // Releasing rather than merely cancelling: a navigation landing inside
      // those two frames must not leave a block hidden with nothing left to
      // show it.
      cancelAnimationFrame(frame);
      for (const el of entering) el.removeAttribute("data-armed");
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
