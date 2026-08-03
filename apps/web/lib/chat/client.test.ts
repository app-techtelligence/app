import { describe, expect, it } from "vitest";
import { parseSseChunk, pruneMessages } from "./client";

describe("parseSseChunk", () => {
  it("extrai eventos completos e guarda o resto", () => {
    const raw = 'event: delta\ndata: {"text":"Oi"}\n\nevent: done\ndata: {}\n\nevent: del';
    const { events, rest } = parseSseChunk(raw);
    expect(events).toEqual([{ event: "delta", text: "Oi" }, { event: "done" }]);
    expect(rest).toBe("event: del");
  });

  it("ignora eventos malformados sem quebrar", () => {
    const { events } = parseSseChunk("lixo\n\nevent: delta\ndata: {nope\n\n");
    expect(events).toEqual([]);
  });
});

describe("pruneMessages", () => {
  const msg = (role: "user" | "assistant", content: string) => ({ role, content });

  it("não mexe quando cabe", () => {
    const messages = [msg("assistant", "oi"), msg("user", "olá")];
    expect(pruneMessages(messages, 100)).toEqual(messages);
  });

  it("remove as mais antigas até caber", () => {
    const messages = [
      msg("assistant", "a".repeat(50)),
      msg("user", "b".repeat(50)),
      msg("user", "c".repeat(50)),
    ];
    const pruned = pruneMessages(messages, 110);
    expect(pruned).toHaveLength(2);
    expect(pruned[0].content[0]).toBe("b");
  });
});
