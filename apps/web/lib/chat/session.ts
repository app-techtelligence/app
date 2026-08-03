import { SESSION_TTL_MS } from "./constants";

// Token de sessão stateless (spec §5): claims {iat, exp, nonce} em base64url,
// assinados com HMAC-SHA256 via WebCrypto — disponível em Workers e Node.

const encoder = new TextEncoder();

type SessionClaims = { iat: number; exp: number; nonce: string };

function toBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(
  secret: string,
  now: number = Date.now(),
): Promise<string> {
  const claims: SessionClaims = {
    iat: now,
    exp: now + SESSION_TTL_MS,
    nonce: crypto.randomUUID(),
  };
  const payload = toBase64url(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(payload),
  );
  return `${payload}.${toBase64url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
  opts: { graceMs?: number; now?: number } = {},
): Promise<boolean> {
  const { graceMs = 0, now = Date.now() } = opts;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = fromBase64url(signature);
  } catch {
    return false;
  }
  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    signatureBytes as BufferSource,
    encoder.encode(payload),
  );
  if (!valid) return false;
  try {
    const claims = JSON.parse(
      new TextDecoder().decode(fromBase64url(payload)),
    ) as SessionClaims;
    return typeof claims.exp === "number" && now <= claims.exp + graceMs;
  } catch {
    return false;
  }
}
