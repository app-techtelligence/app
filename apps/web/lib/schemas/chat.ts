import { z } from "zod";
import {
  CHAT_TOPICS,
  MAX_PAYLOAD_CHARS,
  MAX_USER_MESSAGE_CHARS,
  MAX_USER_MESSAGES,
} from "@/lib/chat/constants";

/** Compartilhado entre widget, /api/chat e a transcrição do lead. */
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

const localeSchema = z.enum(["pt-BR", "en"]);

/** Validações comuns a transcrições: limites por mensagem e total (sem limite de contagem). */
const transcriptArraySchema = z
  .array(chatMessageSchema)
  .min(1)
  .refine(
    (msgs) =>
      msgs
        .filter((m) => m.role === "user")
        .every((m) => m.content.length <= MAX_USER_MESSAGE_CHARS),
    { message: "user_message_too_long" },
  )
  .refine(
    (msgs) => msgs.reduce((n, m) => n + m.content.length, 0) <= MAX_PAYLOAD_CHARS,
    { message: "payload_too_large" },
  );

/** Mensagens do chat com limite de 20 mensagens de usuário. */
const messagesArraySchema = transcriptArraySchema.refine(
  (msgs) => msgs.filter((m) => m.role === "user").length <= MAX_USER_MESSAGES,
  { message: "too_many_user_messages" },
);

export const sessionRequestSchema = z.object({
  turnstileToken: z.string().min(1),
  locale: localeSchema,
});

export const chatRequestSchema = z.object({
  sessionToken: z.string().min(1),
  locale: localeSchema,
  messages: messagesArraySchema.refine(
    (msgs) => msgs[msgs.length - 1]?.role === "user",
    { message: "last_message_not_user" },
  ),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const leadRequestSchema = z
  .object({
    sessionToken: z.string().min(1),
    locale: localeSchema,
    name: z.string().trim().min(2).max(100),
    email: z.union([z.email().max(200), z.literal("")]).optional(),
    phone: z
      .string()
      .trim()
      .max(30)
      .regex(/^[0-9+()\-\s]*$/)
      .optional(),
    consent: z.literal(true),
    topic: z.enum(CHAT_TOPICS),
    transcript: transcriptArraySchema,
    /** Honeypot — usuários reais nunca preenchem. */
    website: z.literal("").optional(),
  })
  .refine((d) => Boolean(d.email) || Boolean(d.phone?.trim()), {
    message: "contact_required",
  });
export type LeadRequest = z.infer<typeof leadRequestSchema>;
