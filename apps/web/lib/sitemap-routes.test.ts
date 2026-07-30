import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { INTERNAL_PATHNAMES, publicStaticPathnames } from "./sitemap-routes";

describe("sitemap routes", () => {
  it("treats /styleguide as an internal route", () => {
    expect(INTERNAL_PATHNAMES).toContain("/styleguide");
  });

  it("keeps internal routes out of the sitemap", () => {
    const published = publicStaticPathnames();
    for (const internal of INTERNAL_PATHNAMES) {
      expect(published).not.toContain(internal);
    }
  });

  // Exact, not `toContain`. This is the backstop for the failure the module
  // exists to prevent: adding any route to routing.pathnames breaks this
  // assertion, which forces a deliberate choice — publish it by listing it
  // here, or hide it by listing it in INTERNAL_PATHNAMES. A `toContain` set
  // cannot detect an addition, so it would not catch a leaked internal route.
  it("publishes exactly the marketing pages and nothing else", () => {
    expect([...publicStaticPathnames()].sort()).toEqual([
      "/",
      "/about",
      "/blog",
      "/consulting",
      "/consulting/ai",
      "/consulting/data-governance",
      "/contact",
      "/course",
      "/mentorship",
      "/privacy",
    ]);
  });

  it("excludes dynamic segments, which get their entries from real data", () => {
    expect(publicStaticPathnames().every((href) => !href.includes("["))).toBe(true);
  });

  it("only ever returns keys that exist in the routing config", () => {
    const known = Object.keys(routing.pathnames);
    for (const href of publicStaticPathnames()) {
      expect(known).toContain(href);
    }
  });
});
