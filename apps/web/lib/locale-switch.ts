import type { StaticAppPathname } from "@/i18n/routing";

/**
 * Where a locale swap should point.
 *
 * Blog posts carry a slug per language (`slug` / `slug_en`), so `usePathname()`
 * reports the template `/blog/[slug]` on those pages — swapping the locale over
 * it would 404. There we fall back to the listing, which exists in both.
 */
export function localeSwitchHref(pathname: string): StaticAppPathname {
  return (pathname.includes("[") ? "/blog" : pathname) as StaticAppPathname;
}
