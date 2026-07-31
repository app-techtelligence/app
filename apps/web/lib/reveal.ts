/*
 * Marking a section for the scroll reveal:
 *
 *     <section data-reveal suppressHydrationWarning className="…">
 *
 * `suppressHydrationWarning` is not optional. The bootstrap script writes
 * `data-armed` onto these elements before React hydrates, so React finds an
 * attribute it never rendered and logs a mismatch for every armed section. It
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
 * Should this element start hidden? Anything that has not yet climbed
 * `REVEAL_TRIGGER` into the viewport — which includes everything below the
 * fold and a section merely peeking at the bottom edge.
 *
 * Arming a peeking section is only safe because the bootstrap in
 * `reveal-bootstrap.ts` runs before the first paint. Hiding it later, from a
 * React effect, would flash it out of existence.
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
