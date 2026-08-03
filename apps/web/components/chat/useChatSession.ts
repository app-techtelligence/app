"use client";

import { useCallback, useState } from "react";

type SessionState = "idle" | "verifying" | "ready" | "error";

/** Turnstile invisível → POST /api/chat/session → token HMAC (spec §5).
 *  O widget do Turnstile é renderizado pelo ChatPanel; este hook recebe o
 *  token do captcha e troca por um token de sessão. */
export function useChatSession(locale: string) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [state, setState] = useState<SessionState>("idle");

  const exchange = useCallback(
    async (turnstileToken: string) => {
      setState("verifying");
      try {
        const response = await fetch("/api/chat/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ turnstileToken, locale }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { sessionToken: string };
        setSessionToken(data.sessionToken);
        setState("ready");
      } catch {
        setState("error");
      }
    },
    [locale],
  );

  const reset = useCallback(() => {
    setSessionToken(null);
    setState("idle");
  }, []);

  return { sessionToken, state, exchange, reset };
}
