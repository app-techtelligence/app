import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import Anthropic from "@anthropic-ai/sdk";
import { chatRequestSchema } from "@/lib/schemas/chat";
import { verifySessionToken } from "@/lib/chat/session";
import { buildSystemBlocks } from "@/lib/chat/prompt";
import {
  CHAT_MODEL,
  DEV_SESSION_TOKEN,
  MAX_OUTPUT_TOKENS,
} from "@/lib/chat/constants";

// Rota do assistente (spec §5): stateless, valida sessão + limites (§4) e
// repassa a resposta do modelo num SSE próprio (delta/done/error) — nunca o
// wire format cru da Anthropic. Conversas NÃO são armazenadas nem logadas.

const encoder = new TextEncoder();

function sse(
  pump: (send: (event: string, data?: unknown) => void) => Promise<void>,
): Response {
  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: string, data?: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data ?? {})}\n\n`),
        );
      };
      try {
        await pump(send);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(readable, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const data = parsed.data;

  const { env } = getCloudflareContext();

  if (env.CHAT_SESSION_SECRET) {
    const ok = await verifySessionToken(data.sessionToken, env.CHAT_SESSION_SECRET);
    if (!ok) return NextResponse.json({ error: "session" }, { status: 403 });
  } else if (data.sessionToken !== DEV_SESSION_TOKEN) {
    return NextResponse.json({ error: "session" }, { status: 403 });
  }

  if (!env.ANTHROPIC_API_KEY) {
    if (env.CHAT_SESSION_SECRET) {
      // Ambiente com cara de prod (secret configurado) mas sem a chave: falha
      // visível (spec §7), nunca o stub — o widget cai no fallback desenhado
      // (indisponível + WhatsApp + contato) em vez de mostrar texto de dev.
      console.error("[chat] ANTHROPIC_API_KEY missing in configured environment");
      return sse(async (send) => {
        send("error");
      });
    }
    // Dev local sem chave: stub fixo, mesmo espírito do stub do Resend.
    console.warn("[chat] ANTHROPIC_API_KEY not set — streaming stub reply");
    return sse(async (send) => {
      send("delta", { text: "(dev) Assistente sem ANTHROPIC_API_KEY — resposta de teste." });
      send("done");
    });
  }

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const stream = anthropic.messages.stream({
    model: CHAT_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: buildSystemBlocks(data.locale),
    messages: data.messages,
  });

  return sse(async (send) => {
    try {
      stream.on("text", (delta) => send("delta", { text: delta }));
      await stream.finalMessage();
      send("done");
    } catch {
      // Sem detalhes no log: nada de conteúdo de conversa ou erro upstream com PII.
      console.error("[chat] model stream failed");
      send("error");
    }
  });
}
