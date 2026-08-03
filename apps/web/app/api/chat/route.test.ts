import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { createSessionToken } from "@/lib/chat/session";
import { DEV_SESSION_TOKEN, MAX_OUTPUT_TOKENS, MAX_USER_MESSAGES } from "@/lib/chat/constants";

const env: { CHAT_SESSION_SECRET?: string; ANTHROPIC_API_KEY?: string } = {};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env }),
}));

const streamMock = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { stream: streamMock };
  },
}));

import { POST } from "./route";

function fakeStream(deltas: string[], fail = false) {
  return {
    on(event: string, cb: (chunk: string) => void) {
      if (event === "text") for (const d of deltas) cb(d);
      return this;
    },
    async finalMessage() {
      if (fail) throw new Error("upstream");
      return {};
    },
  };
}

const SECRET = "session_secret";
let token: string;

function postRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const baseBody = () => ({
  sessionToken: token,
  locale: "pt-BR" as const,
  messages: [
    { role: "assistant" as const, content: "Olá!" },
    { role: "user" as const, content: "O que é a consultoria?" },
  ],
});

beforeEach(async () => {
  env.CHAT_SESSION_SECRET = SECRET;
  env.ANTHROPIC_API_KEY = "sk-ant-test";
  token = await createSessionToken(SECRET);
  streamMock.mockReturnValue(fakeStream(["Olá", ", tudo bem?"]));
});
afterEach(() => vi.clearAllMocks());

describe("POST /api/chat", () => {
  it("400 em payload inválido", async () => {
    const response = await POST(postRequest({ nope: true }));
    expect(response.status).toBe(400);
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("403 com token de sessão inválido", async () => {
    const response = await POST(postRequest({ ...baseBody(), sessionToken: "forjado" }));
    expect(response.status).toBe(403);
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("400 com mais de 20 mensagens user (backstop do servidor)", async () => {
    const messages = Array.from({ length: MAX_USER_MESSAGES + 1 }, (_, i) => ({
      role: "user" as const,
      content: `m${i}`,
    }));
    const response = await POST(postRequest({ ...baseBody(), messages }));
    expect(response.status).toBe(400);
  });

  it("faz stream SSE com delta e done, chamando o modelo com os tetos", async () => {
    const response = await POST(postRequest(baseBody()));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const body = await response.text();
    expect(body).toContain('event: delta');
    expect(body).toContain('{"text":"Olá"}');
    expect(body).toContain("event: done");

    const params = streamMock.mock.calls[0][0];
    expect(params.model).toBe("claude-haiku-4-5");
    expect(params.max_tokens).toBe(MAX_OUTPUT_TOKENS);
    expect(params.system[0].cache_control).toEqual({ type: "ephemeral" });
  });

  it("emite event: error quando o upstream falha no meio", async () => {
    streamMock.mockReturnValue(fakeStream(["parcial"], true));
    const response = await POST(postRequest(baseBody()));
    const body = await response.text();
    expect(body).toContain("event: error");
  });

  it("responde stub em SSE quando não há CHAT_SESSION_SECRET nem ANTHROPIC_API_KEY (dev local)", async () => {
    env.CHAT_SESSION_SECRET = undefined;
    env.ANTHROPIC_API_KEY = undefined;
    const response = await POST(
      postRequest({ ...baseBody(), sessionToken: DEV_SESSION_TOKEN }),
    );
    const body = await response.text();
    expect(body).toContain("event: delta");
    expect(body).toContain("event: done");
    expect(streamMock).not.toHaveBeenCalled();
  });

  it("emite só event: error quando falta ANTHROPIC_API_KEY num ambiente configurado (prod)", async () => {
    env.ANTHROPIC_API_KEY = undefined;
    // env.CHAT_SESSION_SECRET permanece definido (beforeEach) — ambiente com
    // cara de prod, então o widget deve cair no fallback, nunca no stub de dev.
    const response = await POST(postRequest(baseBody()));
    const body = await response.text();
    expect(body).toContain("event: error");
    expect(body).not.toContain("event: delta");
    expect(streamMock).not.toHaveBeenCalled();
  });
});
