import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/chat/session";
import { DEV_SESSION_TOKEN } from "@/lib/chat/constants";

const env: { TURNSTILE_SECRET_KEY?: string; CHAT_SESSION_SECRET?: string } = {};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env }),
}));
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { POST } from "./route";

function postRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/chat/session", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.7" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as NextRequest;
}

beforeEach(() => {
  env.TURNSTILE_SECRET_KEY = "secret_abc";
  env.CHAT_SESSION_SECRET = "session_secret";
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true })));
});
afterEach(() => vi.clearAllMocks());

describe("POST /api/chat/session", () => {
  it("400 em payload inválido", async () => {
    const response = await POST(postRequest({ locale: "pt-BR" }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("403 quando o Turnstile recusa", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: false })));
    const response = await POST(postRequest({ turnstileToken: "t", locale: "pt-BR" }));
    expect(response.status).toBe(403);
  });

  it("emite um token verificável no caminho feliz", async () => {
    const response = await POST(postRequest({ turnstileToken: "t", locale: "en" }));
    expect(response.status).toBe(200);
    const { sessionToken } = (await response.json()) as { sessionToken: string };
    expect(await verifySessionToken(sessionToken, "session_secret")).toBe(true);
  });

  it("devolve o token de dev quando não há segredo (local)", async () => {
    env.CHAT_SESSION_SECRET = undefined;
    const response = await POST(postRequest({ turnstileToken: "t", locale: "pt-BR" }));
    const { sessionToken } = (await response.json()) as { sessionToken: string };
    expect(sessionToken).toBe(DEV_SESSION_TOKEN);
  });
});
