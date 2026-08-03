import { describe, expect, it } from "vitest";
import {
  chatRequestSchema,
  leadRequestSchema,
  sessionRequestSchema,
} from "./chat";
import {
  MAX_PAYLOAD_CHARS,
  MAX_USER_MESSAGE_CHARS,
  MAX_USER_MESSAGES,
} from "@/lib/chat/constants";

const user = (content: string) => ({ role: "user" as const, content });
const bot = (content: string) => ({ role: "assistant" as const, content });

const validChat = {
  sessionToken: "tok",
  locale: "pt-BR",
  messages: [bot("Olá!"), user("Quanto custa a consultoria?")],
};

describe("chatRequestSchema", () => {
  it("aceita um payload válido", () => {
    expect(chatRequestSchema.safeParse(validChat).success).toBe(true);
  });

  it("recusa quando a última mensagem não é do usuário", () => {
    const bad = { ...validChat, messages: [user("oi"), bot("olá")] };
    expect(chatRequestSchema.safeParse(bad).success).toBe(false);
  });

  it("recusa mensagem de usuário acima do limite de caracteres", () => {
    const bad = {
      ...validChat,
      messages: [user("x".repeat(MAX_USER_MESSAGE_CHARS + 1))],
    };
    expect(chatRequestSchema.safeParse(bad).success).toBe(false);
  });

  it("recusa payload total acima do teto", () => {
    const chunk = "x".repeat(900); // < 1000 por mensagem
    const messages = [];
    while (messages.length * 900 <= MAX_PAYLOAD_CHARS) {
      messages.push(bot(chunk)); // assistant não tem limite unitário
    }
    messages.push(user("oi"));
    expect(chatRequestSchema.safeParse({ ...validChat, messages }).success).toBe(false);
  });

  it("recusa mais de 20 mensagens de usuário", () => {
    const messages = Array.from({ length: MAX_USER_MESSAGES + 1 }, (_, i) =>
      user(`m${i}`),
    );
    expect(chatRequestSchema.safeParse({ ...validChat, messages }).success).toBe(false);
  });

  it("recusa locale desconhecido e role desconhecida", () => {
    expect(chatRequestSchema.safeParse({ ...validChat, locale: "es" }).success).toBe(false);
    const bad = { ...validChat, messages: [{ role: "system", content: "x" }] };
    expect(chatRequestSchema.safeParse(bad).success).toBe(false);
  });
});

describe("sessionRequestSchema", () => {
  it("exige turnstileToken e locale", () => {
    expect(sessionRequestSchema.safeParse({ turnstileToken: "t", locale: "en" }).success).toBe(true);
    expect(sessionRequestSchema.safeParse({ locale: "en" }).success).toBe(false);
  });
});

describe("leadRequestSchema", () => {
  const validLead = {
    sessionToken: "tok",
    locale: "pt-BR",
    name: "Maria Silva",
    email: "maria@example.com",
    phone: "",
    consent: true,
    topic: "consultoria",
    transcript: [bot("Olá!"), user("Quero um orçamento")],
    website: "",
  };

  it("aceita lead válido com e-mail", () => {
    expect(leadRequestSchema.safeParse(validLead).success).toBe(true);
  });

  it("aceita lead válido só com telefone", () => {
    const lead = { ...validLead, email: "", phone: "+55 11 91234-5678" };
    expect(leadRequestSchema.safeParse(lead).success).toBe(true);
  });

  it("recusa sem nenhum contato", () => {
    expect(leadRequestSchema.safeParse({ ...validLead, email: "", phone: "" }).success).toBe(false);
  });

  it("recusa sem consentimento", () => {
    expect(leadRequestSchema.safeParse({ ...validLead, consent: false }).success).toBe(false);
  });

  it("recusa honeypot preenchido", () => {
    expect(leadRequestSchema.safeParse({ ...validLead, website: "spam" }).success).toBe(false);
  });

  it("recusa transcrição acima do teto de caracteres", () => {
    const transcript = Array.from({ length: 15 }, () => bot("x".repeat(900)));
    expect(leadRequestSchema.safeParse({ ...validLead, transcript }).success).toBe(false);
  });

  it("recusa topic fora do enum", () => {
    expect(leadRequestSchema.safeParse({ ...validLead, topic: "vendas" }).success).toBe(false);
  });
});
