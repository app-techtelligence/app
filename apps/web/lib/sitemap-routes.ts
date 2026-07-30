import { routing, type AppPathname, type StaticAppPathname } from "@/i18n/routing";

/**
 * Routes registered for navigation and middleware but deliberately unpublished.
 * They are noindexed at the page level too; this keeps them out of the sitemap,
 * which would otherwise advertise every key in routing.pathnames.
 */
export const INTERNAL_PATHNAMES: readonly AppPathname[] = ["/styleguide"];

/** Sitemap-eligible routes: public, and without a dynamic segment. */
export function publicStaticPathnames(): StaticAppPathname[] {
  return (Object.keys(routing.pathnames) as AppPathname[]).filter(
    (href): href is StaticAppPathname =>
      !href.includes("[") && !INTERNAL_PATHNAMES.includes(href),
  );
}
