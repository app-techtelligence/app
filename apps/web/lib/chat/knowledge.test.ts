import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { knowledge } from "./knowledge.generated";

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, "..", "..", "content", "assistant");
const locales = ["pt-BR", "en"] as const;

function topicsOf(locale: string): string[] {
  return readdirSync(join(contentDir, locale))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
}

describe("assistant knowledge base", () => {
  it("pt-BR e en têm os mesmos arquivos", () => {
    expect(topicsOf("en")).toEqual(topicsOf("pt-BR"));
  });

  it("nenhum arquivo é vazio", () => {
    for (const locale of locales) {
      for (const topic of topicsOf(locale)) {
        const text = readFileSync(join(contentDir, locale, `${topic}.md`), "utf8");
        expect(text.trim().length, `${locale}/${topic}.md`).toBeGreaterThan(50);
      }
    }
  });

  it("knowledge.generated.ts está em sincronia com os .md (rode pnpm --filter web generate:knowledge)", () => {
    for (const locale of locales) {
      const generated = knowledge[locale] as Record<string, string>;
      expect(Object.keys(generated).sort()).toEqual(topicsOf(locale));
      for (const topic of topicsOf(locale)) {
        // Mesma normalização do gerador: checkouts Windows podem materializar CRLF.
        const onDisk = readFileSync(join(contentDir, locale, `${topic}.md`), "utf8")
          .replaceAll("\r\n", "\n");
        expect(generated[topic], `${locale}/${topic}`).toBe(onDisk);
      }
    }
  });
});
