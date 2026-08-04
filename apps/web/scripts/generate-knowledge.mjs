// Gera lib/chat/knowledge.generated.ts a partir de content/assistant/**/*.md.
// Mesmo padrão do generate-headers.mjs (roda no prebuild). O módulo gerado é
// COMMITADO porque o CI roda typecheck/test sem build; o teste
// lib/chat/knowledge.test.ts falha se ele sair de sincronia com os .md.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const locales = ["pt-BR", "en"];

const lines = [
  "// GENERATED FILE — do not edit. Source: content/assistant/**/*.md",
  "// Regenerate: pnpm --filter web generate:knowledge",
  "",
  "export const knowledge = {",
];
for (const locale of locales) {
  const dir = join(root, "content", "assistant", locale);
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  lines.push(`  "${locale}": {`);
  for (const file of files) {
    // Normaliza CRLF de checkouts Windows: o módulo gerado embute sempre LF.
    const text = readFileSync(join(dir, file), "utf8").replaceAll("\r\n", "\n");
    lines.push(`    "${basename(file, ".md")}": ${JSON.stringify(text)},`);
  }
  lines.push("  },");
}
lines.push("} as const;", "");
writeFileSync(join(root, "lib", "chat", "knowledge.generated.ts"), lines.join("\n"));
console.log("[generate-knowledge] wrote lib/chat/knowledge.generated.ts");
