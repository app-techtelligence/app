import { describe, expect, it } from "vitest";
import { localeSwitchHref } from "./locale-switch";

describe("localeSwitchHref", () => {
  it("keeps static pathnames", () => {
    expect(localeSwitchHref("/")).toBe("/");
    expect(localeSwitchHref("/consulting")).toBe("/consulting");
    expect(localeSwitchHref("/blog")).toBe("/blog");
  });

  it("falls back to the listing on post pages", () => {
    expect(localeSwitchHref("/blog/[slug]")).toBe("/blog");
  });
});
