import { z } from "zod";

/** Shared by the client form and the API route — single source of truth. */
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  subject: z.enum(["course", "mentorship", "consulting", "other"]),
  message: z.string().trim().min(10).max(2000),
  turnstileToken: z.string().min(1),
  /** Honeypot — real users never fill this. */
  website: z.literal("").optional(),
});

export type ContactPayload = z.infer<typeof contactSchema>;
