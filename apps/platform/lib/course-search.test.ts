import { describe, expect, it } from "vitest";
import { matchesQuery, normalizeForSearch } from "./course-search";

describe("normalizeForSearch", () => {
  it("lowercases and strips accents", () => {
    expect(normalizeForSearch("Introdução")).toBe("introducao");
    expect(normalizeForSearch("Lição Três")).toBe("licao tres");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeForSearch("  perfil  ")).toBe("perfil");
  });
});

describe("matchesQuery", () => {
  it("matches accent-insensitively in both directions", () => {
    expect(matchesQuery("licao", "Lição 1 — Perfil")).toBe(true);
    expect(matchesQuery("Lição", "licao 1")).toBe(true);
  });

  it("matches case-insensitively across any field", () => {
    expect(matchesQuery("PERFIL", "Aula 1", "Otimize seu perfil")).toBe(true);
  });

  it("treats an empty or whitespace query as match-all", () => {
    expect(matchesQuery("", "qualquer coisa")).toBe(true);
    expect(matchesQuery("   ", "qualquer coisa")).toBe(true);
  });

  it("ignores null and undefined fields", () => {
    expect(matchesQuery("x", null, undefined)).toBe(false);
    expect(matchesQuery("x", null, "texto com x")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesQuery("entrevista", "Currículo", "LinkedIn")).toBe(false);
  });
});
