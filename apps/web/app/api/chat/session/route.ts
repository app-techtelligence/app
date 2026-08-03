import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sessionRequestSchema } from "@/lib/schemas/chat";
import { createSessionToken } from "@/lib/chat/session";
import { DEV_SESSION_TOKEN } from "@/lib/chat/constants";

// Abertura de sessão do assistente (spec §5): Turnstile invisível valida que há
// um humano; o token HMAC emitido libera /api/chat por 30 min. Rate limit por
// IP fica no WAF (como /api/contact). Nada é armazenado.

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const parsed = sessionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { env } = getCloudflareContext();

  const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: parsed.data.turnstileToken,
      remoteip: request.headers.get("cf-connecting-ip") ?? undefined,
    }),
  });
  const verification = (await verifyResponse.json()) as { success: boolean };
  if (!verification.success) {
    return NextResponse.json({ error: "turnstile" }, { status: 403 });
  }

  if (!env.CHAT_SESSION_SECRET) {
    console.warn("[chat] CHAT_SESSION_SECRET not set — issuing dev token");
    return NextResponse.json({ sessionToken: DEV_SESSION_TOKEN });
  }
  return NextResponse.json({
    sessionToken: await createSessionToken(env.CHAT_SESSION_SECRET),
  });
}
