import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";

/** A payload that must pass — each test overrides one field. */
const valid = {
  name: "Maria Silva",
  email: "maria@example.com",
  subject: "course",
  message: "Quero saber mais sobre o curso de transição de carreira.",
  turnstileToken: "tok_123",
  website: "",
};

describe("contactSchema", () => {
  it("accepts a valid payload", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a payload without the honeypot field", () => {
    const rest: Partial<typeof valid> = { ...valid };
    delete rest.website;
    expect(contactSchema.safeParse(rest).success).toBe(true);
  });

  it("rejects a filled honeypot (bot submission)", () => {
    const result = contactSchema.safeParse({ ...valid, website: "https://spam.example" });
    expect(result.success).toBe(false);
  });

  it("trims whitespace on name and message", () => {
    const result = contactSchema.safeParse({
      ...valid,
      name: "  Maria Silva  ",
      message: `  ${valid.message}  `,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Maria Silva");
      expect(result.data.message).toBe(valid.message);
    }
  });

  it.each([
    ["name too short", { name: "M" }],
    ["name whitespace-only", { name: "   " }],
    ["name too long", { name: "a".repeat(101) }],
    ["invalid email", { email: "not-an-email" }],
    ["email too long", { email: `${"a".repeat(195)}@b.com` }],
    ["unknown subject", { subject: "sales" }],
    ["message too short", { message: "oi" }],
    ["message too long", { message: "a".repeat(2001) }],
    ["empty turnstile token", { turnstileToken: "" }],
    ["missing turnstile token", { turnstileToken: undefined }],
  ])("rejects %s", (_label, override) => {
    expect(contactSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
