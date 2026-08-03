import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Resend } from "resend";
import { leadRequestSchema } from "@/lib/schemas/chat";
import { verifySessionToken } from "@/lib/chat/session";
import { DEV_SESSION_TOKEN, LEAD_GRACE_MS, type ChatTopic } from "@/lib/chat/constants";
import { siteConfig } from "@/lib/site-config";

// Lead do assistente (spec §3/§5): coleta SEMPRE por formulário validado com
// consentimento explícito — nunca "anotada" pela IA. A transcrição vai em
// texto plano no e-mail (única retenção; descrita na página de privacidade).

const topicLabels: Record<ChatTopic, string> = {
  consultoria: "Consultoria",
  curso: "Curso",
  mentoria: "Mentoria",
  "criacao-de-sites": "Criação de sites",
  outros: "Outros",
};

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const parsed = leadRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const data = parsed.data;

  const { env } = getCloudflareContext();

  if (env.CHAT_SESSION_SECRET) {
    // Tolerância pós-expiração: um lead digitado no minuto 31 não se perde.
    // O limite de 20 mensagens NÃO se aplica aqui (spec §5).
    const ok = await verifySessionToken(data.sessionToken, env.CHAT_SESSION_SECRET, {
      graceMs: LEAD_GRACE_MS,
    });
    if (!ok) return NextResponse.json({ error: "session" }, { status: 403 });
  } else if (data.sessionToken !== DEV_SESSION_TOKEN) {
    return NextResponse.json({ error: "session" }, { status: 403 });
  }

  if (!env.RESEND_API_KEY) {
    console.warn("[chat-lead] RESEND_API_KEY not set — email delivery skipped");
    return NextResponse.json({ ok: true });
  }

  const transcript = data.transcript
    .map((m) => `${m.role === "user" ? "Visitante" : "Assistente"}: ${m.content}`)
    .join("\n");

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: siteConfig.emailFrom,
    to: siteConfig.contactFormRecipient,
    replyTo: data.email || undefined,
    subject: `[Site] Assistente — ${topicLabels[data.topic]} — ${data.name}`,
    text: [
      `Lead do assistente do site (idioma da conversa: ${data.locale})`,
      "",
      `Nome: ${data.name}`,
      `E-mail: ${data.email || "—"}`,
      `Telefone: ${data.phone || "—"}`,
      `Assunto: ${topicLabels[data.topic]}`,
      `Consentimento: sim (formulário do chat)`,
      "",
      "— Conversa até aqui —",
      transcript,
    ].join("\n"),
  });

  if (error) {
    console.error("[chat-lead] delivery failed:", error.name);
    return NextResponse.json({ error: "delivery" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
