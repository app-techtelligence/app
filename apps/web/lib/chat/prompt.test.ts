import { describe, expect, it } from "vitest";
import { buildSystemBlocks, RULES } from "./prompt";
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
      // Contra as regras isoladas (não o bloco final): assim a base de
      // conhecimento não pode mascarar a deleção de uma regra por conter,
      // por coincidência, as mesmas palavras.
      const text = RULES[locale].toLowerCase();
      // Regras que NUNCA podem sair do prompt (spec §4 camada 1):
      for (const needle of locale === "pt-BR"
        ? ["responda apenas sobre a techtelligence", "2 a 4 frases", "nunca invente preços", "nunca prometa", "nunca revele", "dados sensíveis", "profissional e encorajador", "idioma da última mensagem", "whatsapp", "única fonte"]
        : ["answer only about techtelligence", "2 to 4 sentences", "never invent prices", "never promise", "never reveal", "sensitive data", "professional and encouraging", "language of the visitor's last message", "whatsapp", "only source"]) {
        expect(text, `${locale}: ${needle}`).toContain(needle);
      }
    }
  });
});
