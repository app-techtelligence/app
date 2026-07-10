import { describe, expect, it } from "vitest";
import ptBR from "./pt-BR.json";
import en from "./en.json";

/**
 * CLAUDE.md §5: every UI string exists in BOTH locale files. Comparing the
 * full key-path sets catches the usual slip — adding a string to one file
 * and forgetting the other.
 */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }
  // Arrays descend by index so list-length drift between locales fails too.
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("message catalogs", () => {
  it("pt-BR and en define the same keys", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(ptBR).sort());
  });

  it("no message is empty", () => {
    for (const catalog of [ptBR, en]) {
      const empties = keyPaths(catalog).filter((path) => {
        const value = path
          .split(".")
          .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], catalog);
        return typeof value !== "string" || value.trim() === "";
      });
      expect(empties).toEqual([]);
    }
  });
});
