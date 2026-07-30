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

  it("still publishes the real marketing pages", () => {
    const published = publicStaticPathnames();
    expect(published).toContain("/");
    expect(published).toContain("/consulting");
    expect(published).toContain("/course");
    expect(published).toContain("/mentorship");
    expect(published).toContain("/blog");
    expect(published).toContain("/about");
    expect(published).toContain("/contact");
    expect(published).toContain("/privacy");
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
