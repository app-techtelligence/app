import { describe, expect, it } from "vitest";
import { buildSystemBlocks } from "./prompt";
import { knowledge } from "./knowledge.generated";

describe("buildSystemBlocks", () => {
  it("gera um único bloco cacheável", () => {
    const blocks = buildSystemBlocks("pt-BR");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].cache_control).toEqual({ type: "ephemeral" });
  });

  it("inclui a base de conhecimento do locale certo", () => {
    const pt = buildSystemBlocks("pt-BR")[0].text;
    const en = buildSystemBlocks("en")[0].text;
    expect(pt).toContain(knowledge["pt-BR"].consultoria.slice(0, 60));
    expect(en).toContain(knowledge.en.consultoria.slice(0, 60));
  });

  it("inclui os guardrails inegociáveis", () => {
    for (const locale of ["pt-BR", "en"] as const) {
      const text = buildSystemBlocks(locale)[0].text.toLowerCase();
      // Regras que NUNCA podem sair do prompt (spec §4 camada 1):
      for (const needle of locale === "pt-BR"
        ? ["nunca invente preços", "nunca prometa", "nunca revele", "2 a 4 frases"]
        : ["never invent prices", "never promise", "never reveal", "2 to 4 sentences"]) {
        expect(text, `${locale}: ${needle}`).toContain(needle);
      }
    }
  });
});
