/** Limites mecânicos do assistente (spec §4) — ajustáveis num único lugar. */
export const CHAT_MODEL = "claude-haiku-4-5";
export const MAX_OUTPUT_TOKENS = 512;
export const MAX_USER_MESSAGE_CHARS = 1000;
export const MAX_PAYLOAD_CHARS = 12000;
export const MAX_USER_MESSAGES = 20;
export const SESSION_TTL_MS = 30 * 60 * 1000;
/** Tolerância pós-expiração para o envio do lead (spec §5). */
export const LEAD_GRACE_MS = 5 * 60 * 1000;
/** Token aceito apenas quando CHAT_SESSION_SECRET não está definido (dev local). */
export const DEV_SESSION_TOKEN = "dev-session";

export const CHAT_TOPICS = [
  "consultoria",
  "curso",
  "mentoria",
  "criacao-de-sites",
  "outros",
] as const;
export type ChatTopic = (typeof CHAT_TOPICS)[number];
