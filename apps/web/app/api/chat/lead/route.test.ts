import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/chat/session";
import { SESSION_TTL_MS } from "@/lib/chat/constants";

const env: { CHAT_SESSION_SECRET?: string; RESEND_API_KEY?: string } = {};
const sendMock = vi.fn();
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env }),
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { POST } from "./route";

const SECRET = "session_secret";
let token: string;

const validLead = () => ({
  sessionToken: token,
  locale: "pt-BR",
  name: "Maria Silva",
  email: "maria@example.com",
  phone: "",
  consent: true,
  topic: "consultoria",
  transcript: [
    { role: "assistant", content: "Olá!" },
    { role: "user", content: "Quero um orçamento de plataforma de dados." },
  ],
  website: "",
});

function postRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/chat/lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

beforeEach(async () => {
  env.CHAT_SESSION_SECRET = SECRET;
  env.RESEND_API_KEY = "re_test";
  token = await createSessionToken(SECRET);
  sendMock.mockResolvedValue({ error: null });
});
afterEach(() => vi.clearAllMocks());

describe("POST /api/chat/lead", () => {
  it("400 sem consentimento", async () => {
    const response = await POST(postRequest({ ...validLead(), consent: false }));
    expect(response.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("403 com token expirado além da tolerância", async () => {
    const old = Date.now() - SESSION_TTL_MS - 10 * 60 * 1000;
    const expired = await createSessionToken(SECRET, old);
    const response = await POST(postRequest({ ...validLead(), sessionToken: expired }));
    expect(response.status).toBe(403);
  });

  it("aceita token pouco depois de expirar (tolerância de 5 min)", async () => {
    const old = Date.now() - SESSION_TTL_MS - 2 * 60 * 1000;
    const grace = await createSessionToken(SECRET, old);
    const response = await POST(postRequest({ ...validLead(), sessionToken: grace }));
    expect(response.status).toBe(200);
  });

  it("envia o e-mail com assunto, contato e transcrição", async () => {
    const response = await POST(postRequest(validLead()));
    expect(response.status).toBe(200);
    const message = sendMock.mock.calls[0][0];
    expect(message.subject).toContain("Assistente");
    expect(message.subject).toContain("Consultoria");
    expect(message.text).toContain("Maria Silva");
    expect(message.text).toContain("maria@example.com");
    expect(message.text).toContain("Visitante: Quero um orçamento");
    expect(message.replyTo).toBe("maria@example.com");
  });

  it("502 quando o Resend falha", async () => {
    sendMock.mockResolvedValue({ error: { name: "application_error" } });
    const response = await POST(postRequest(validLead()));
    expect(response.status).toBe(502);
  });

  it("200 sem enviar quando falta RESEND_API_KEY (dev)", async () => {
    env.RESEND_API_KEY = undefined;
    const response = await POST(postRequest(validLead()));
    expect(response.status).toBe(200);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
