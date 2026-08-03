import type { ChatMessage, ChatRequest } from "@/lib/schemas/chat";

// Lado cliente do protocolo SSE próprio (spec §5): delta/done/error.

export class ChatHttpError extends Error {
  constructor(public readonly status: number) {
    super(`chat http ${status}`);
  }
}

export function parseSseChunk(buffer: string): {
  events: Array<{ event: string; text?: string }>;
  rest: string;
} {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: Array<{ event: string; text?: string }> = [];
  for (const raw of parts) {
    const lines = raw.split("\n");
    const event = lines.find((l) => l.startsWith("event: "))?.slice(7);
    const data = lines.find((l) => l.startsWith("data: "))?.slice(6);
    if (!event) continue;
    if (event === "delta") {
      try {
        const parsed = JSON.parse(data ?? "") as { text?: string };
        if (typeof parsed.text === "string") events.push({ event, text: parsed.text });
      } catch {
        // evento malformado: descarta em silêncio
      }
    } else {
      events.push({ event });
    }
  }
  return { events, rest };
}

/** Poda os turnos mais antigos até o payload caber no teto (spec §4 camada 2).
 *  O limite de 20 mensagens é um CONTADOR do widget — a poda não o afeta. */
export function pruneMessages(messages: ChatMessage[], maxChars: number): ChatMessage[] {
  const pruned = [...messages];
  let total = pruned.reduce((n, m) => n + m.content.length, 0);
  while (total > maxChars && pruned.length > 1) {
    const removed = pruned.shift();
    total -= removed ? removed.content.length : 0;
  }
  return pruned;
}

export async function streamChat(
  body: ChatRequest,
  onDelta: (text: string) => void,
): Promise<"done" | "error"> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok || !response.body) throw new ChatHttpError(response.status);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outcome: "done" | "error" = "error";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseSseChunk(buffer);
    buffer = rest;
    for (const e of events) {
      if (e.event === "delta" && e.text) onDelta(e.text);
      else if (e.event === "done") outcome = "done";
      else if (e.event === "error") outcome = "error";
    }
  }
  return outcome;
}
