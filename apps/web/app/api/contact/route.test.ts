import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// Mutable per-test doubles, wired into the mocks below.
const env: { TURNSTILE_SECRET_KEY?: string; RESEND_API_KEY?: string } = {};
const sendMock = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env }),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { POST } from "./route";

const validPayload = {
  name: "Maria Silva",
  email: "maria@example.com",
  subject: "consulting",
  message: "Gostaria de um orçamento para uma plataforma de dados.",
  turnstileToken: "tok_123",
  website: "",
};

function postRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.7",
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as NextRequest;
}

function turnstileReplies(success: boolean) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ success })));
}

beforeEach(() => {
  env.TURNSTILE_SECRET_KEY = "secret_abc";
  env.RESEND_API_KEY = "re_test_key";
  sendMock.mockResolvedValue({ error: null });
  turnstileReplies(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/contact", () => {
  it("returns 400 on malformed JSON", async () => {
    const response = await POST(postRequest("{not json"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "validation" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 on a payload that fails validation", async () => {
    const response = await POST(postRequest({ ...validPayload, email: "nope" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "validation" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("verifies the token with Turnstile, forwarding secret and client IP", async () => {
    await POST(postRequest(validPayload));

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(JSON.parse(init.body)).toEqual({
      secret: "secret_abc",
      response: "tok_123",
      remoteip: "203.0.113.7",
    });
  });

  it("returns 403 when Turnstile rejects the token", async () => {
    turnstileReplies(false);
    const response = await POST(postRequest(validPayload));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "turnstile" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 200 without sending when RESEND_API_KEY is unset (local dev)", async () => {
    env.RESEND_API_KEY = undefined;
    const response = await POST(postRequest(validPayload));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 502 when Resend reports a delivery error", async () => {
    sendMock.mockResolvedValue({ error: { name: "application_error" } });
    const response = await POST(postRequest(validPayload));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "delivery" });
  });

  it("delivers the email and returns 200 on the happy path", async () => {
    const response = await POST(postRequest(validPayload));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    expect(sendMock).toHaveBeenCalledOnce();
    const message = sendMock.mock.calls[0][0];
    expect(message.replyTo).toBe(validPayload.email);
    expect(message.subject).toBe("[Site] Consultoria — Maria Silva");
    expect(message.text).toContain(validPayload.message);
  });
});
