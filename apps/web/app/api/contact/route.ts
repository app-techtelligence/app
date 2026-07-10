import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Resend } from "resend";
import { contactSchema } from "@/lib/schemas/contact";
import { siteConfig } from "@/lib/site-config";

// Contact-form pipeline (CLAUDE.md §8): Zod → Turnstile siteverify → Resend.
// Submissions are NOT stored anywhere, and PII is never logged.
// Rate limiting is a Cloudflare WAF rule on POST /api/contact (see README).

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const subjectLabels: Record<string, string> = {
  consulting: "Consultoria",
  course: "Curso",
  mentorship: "Mentoria",
  other: "Outro assunto",
};

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }
  const data = parsed.data;

  const { env } = getCloudflareContext();

  const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: data.turnstileToken,
      remoteip: request.headers.get("cf-connecting-ip") ?? undefined,
    }),
  });
  const verification = (await verifyResponse.json()) as { success: boolean };
  if (!verification.success) {
    return NextResponse.json({ error: "turnstile" }, { status: 403 });
  }

  if (!env.RESEND_API_KEY) {
    // Local development without a Resend key: accept without delivering.
    console.warn("[contact] RESEND_API_KEY not set — email delivery skipped");
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: siteConfig.emailFrom,
    to: siteConfig.contactFormRecipient,
    replyTo: data.email,
    subject: `[Site] ${subjectLabels[data.subject]} — ${data.name}`,
    text: [
      `Nome: ${data.name}`,
      `E-mail: ${data.email}`,
      `Assunto: ${subjectLabels[data.subject]}`,
      "",
      data.message,
    ].join("\n"),
  });

  if (error) {
    console.error("[contact] delivery failed:", error.name);
    return NextResponse.json({ error: "delivery" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
