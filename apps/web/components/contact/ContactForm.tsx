"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";

// Official always-passing widget key for local dev; the real key is injected
// at build time via NEXT_PUBLIC_TURNSTILE_SITE_KEY (see README).
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

const SUBJECTS = ["course", "mentorship", "consulting", "other"] as const;

type Status = "idle" | "submitting" | "success";
type ErrorKind = "validation" | "turnstile" | "delivery" | "generic" | null;

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-steel/70 focus:border-navy";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [status, setStatus] = useState<Status>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setErrorKind(null);

    if (!turnstileToken) {
      setErrorKind("turnstile");
      return;
    }

    const form = event.currentTarget;
    const fields = new FormData(form);
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fields.get("name"),
          email: fields.get("email"),
          subject: fields.get("subject"),
          message: fields.get("message"),
          website: fields.get("website") ?? "",
          turnstileToken,
        }),
      });

      if (response.ok) {
        setStatus("success");
        return;
      }
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      const kind = body?.error;
      setErrorKind(
        kind === "validation" || kind === "turnstile" || kind === "delivery"
          ? kind
          : "generic",
      );
    } catch {
      setErrorKind("generic");
    } finally {
      setStatus((current) => (current === "success" ? current : "idle"));
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-center rounded-xl border border-navy/10 bg-white p-10 text-center shadow-sm"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent-strong">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-lg font-extrabold tracking-wide text-navy">
          {t("success.title")}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-steel">{t("success.text")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-navy">
            {t("name")}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-navy">
            {t("email")}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-semibold text-navy">
            {t("subject")}
          </label>
          <select id="contact-subject" name="subject" required className={inputCls}>
            {SUBJECTS.map((key) => (
              <option key={key} value={key}>
                {t(`subjectOptions.${key}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-navy">
            {t("message")}
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            className={inputCls}
          />
        </div>

        {/* Honeypot — hidden from real users, tempting for bots. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
        />

        {errorKind ? (
          <p role="alert" className="rounded-md bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800">
            {t(`errors.${errorKind}`)}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={status === "submitting"}>
          {status === "submitting" ? t("submitting") : t("submit")}
        </Button>

        <p className="text-xs leading-relaxed text-steel">{t("privacyNote")}</p>
      </div>
    </form>
  );
}
