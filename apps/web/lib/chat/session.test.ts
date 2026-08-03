import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";
import { SESSION_TTL_MS } from "./constants";

const SECRET = "test-secret-please-rotate";

describe("session token", () => {
  it("cria e verifica um token válido", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe(true);
  });

  it("recusa assinatura adulterada", async () => {
    const token = await createSessionToken(SECRET);
    const [payload] = token.split(".");
    expect(await verifySessionToken(`${payload}.AAAA`, SECRET)).toBe(false);
  });

  it("recusa payload adulterado", async () => {
    const token = await createSessionToken(SECRET);
    const [, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ iat: 0, exp: Date.now() + 999999, nonce: "x" }),
    ).toString("base64url");
    expect(await verifySessionToken(`${forged}.${sig}`, SECRET)).toBe(false);
  });

  it("recusa segredo diferente e lixo", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(token, "outro-segredo")).toBe(false);
    expect(await verifySessionToken("nao-e-um-token", SECRET)).toBe(false);
    expect(await verifySessionToken("", SECRET)).toBe(false);
  });

  it("expira após o TTL e aceita dentro da tolerância", async () => {
    const issued = Date.now();
    const token = await createSessionToken(SECRET, issued);
    const afterExpiry = issued + SESSION_TTL_MS + 1000;
    expect(await verifySessionToken(token, SECRET, { now: afterExpiry })).toBe(false);
    expect(
      await verifySessionToken(token, SECRET, { now: afterExpiry, graceMs: 5 * 60 * 1000 }),
    ).toBe(true);
  });
});
