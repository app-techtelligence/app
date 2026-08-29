/*
 * Marking a block for the reveal:
 *
 *     <section data-reveal suppressHydrationWarning className="…">
 *
 * Mark the element that should move, not the one that paints the background.
 * On a section whose surface differs from the page — a navy band, an off-white
 * strip — the mark belongs on the content inside it, or the rise drags the
 * coloured edge with it and opens a gap against the neighbour. Where the
 * surface is the page's own white, section and content are indistinguishable
 * and the outer element is the simpler mark.
 *
 * `suppressHydrationWarning` is not optional. The bootstrap script writes
 * `data-armed` onto these elements before React hydrates, so React finds an
 * attribute it never rendered and logs a mismatch for every one of them. It
 * does not undo the attribute — the damage is purely a console full of
 * hydration errors nobody reads any more. The prop silences that one element's
 * attribute check and nothing else: children are still fully verified.
 */

/**
 * How far a section must climb into the viewport before it reveals, as a
 * fraction of the viewport height. One number governs both halves of the
 * feature, and it has to: an element is armed exactly when the observer would
 * not reveal it on the spot, so the line that decides "hide this" and the line
 * that decides "show this" are the same line.
 */
export const REVEAL_TRIGGER = 0.25;

/**
 * Does this element have to wait for a scroll before it appears?
 *
 * Every marked block starts hidden — that is what buys the entrance animation,
 * since a fade needs somewhere to fade from. Two frames later everything that
 * has already climbed `REVEAL_TRIGGER` into the viewport is released, and that
 * is the entrance. This function names the remainder: the blocks still short
 * of the line, which stay hidden until the reader scrolls to them.
 *
 * Hiding something that is already on screen is only safe because the two
 * callers both run before a paint — the bootstrap in `reveal-bootstrap.ts`
 * before the document's first one, `RevealObserver` in a layout effect before
 * the navigated page's. From a passive effect it would flash out and back.
 *
 * A `DOMRect` satisfies the parameter structurally, so callers can pass
 * `el.getBoundingClientRect()` with no cast.
 */
export function shouldArm(
  rect: { top: number; height: number },
  viewportHeight: number,
): boolean {
  return (
    viewportHeight > 0 &&
    rect.height > 0 &&
    rect.top >= viewportHeight * (1 - REVEAL_TRIGGER)
  );
}
