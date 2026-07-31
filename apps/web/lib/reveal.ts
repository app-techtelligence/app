/**
 * Should this element start hidden? Only ones entirely below the fold:
 * `useEffect` runs after the first paint, so arming something already on
 * screen would flash it out of existence.
 *
 * A `DOMRect` satisfies the parameter structurally, so callers can pass
 * `el.getBoundingClientRect()` with no cast.
 */
export function shouldArm(
  rect: { top: number; height: number },
  viewportHeight: number,
): boolean {
  return viewportHeight > 0 && rect.height > 0 && rect.top >= viewportHeight;
}
