"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { ChatMessage } from "@/lib/schemas/chat";
import type { ChatTopic } from "@/lib/chat/constants";

type Props = {
  sessionToken: string;
  locale: string;
  topic: ChatTopic;
  transcript: ChatMessage[];
  onSuccess: () => void;
  onCancel: () => void;
};

const inputCls =
  "w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy placeholder:text-steel/70 focus:border-navy";

// "contact" = client-side "nem e-mail nem telefone" (mostra contactHint em
// vermelho); "delivery" = falha de rede/servidor (mostra a mensagem
// genérica). Antes um único booleano fazia os dois casos mostrarem o mesmo
// texto de "não conseguimos enviar", que confundia quem só esqueceu de
// preencher um contato.
type ErrorKind = "contact" | "delivery" | null;

export function LeadForm({ sessionToken, locale, topic, transcript, onSuccess, onCancel }: Props) {
  const t = useTranslations("chat.lead");
  const [submitting, setSubmitting] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setErrorKind(null);
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const phone = String(fields.get("phone") ?? "").trim();
    if (!email && !phone) {
      setErrorKind("contact");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/chat/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          locale,
          name: fields.get("name"),
          email,
          phone,
          consent: fields.get("consent") === "on",
          topic,
          transcript,
          website: fields.get("website") ?? "",
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      onSuccess();
    } catch {
      setErrorKind("delivery");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => setErrorKind(null)}
      className="space-y-3 border-t border-navy/10 bg-canvas p-4"
    >
      <div>
        <p className="text-sm font-extrabold text-navy">{t("title")}</p>
        <p className="mt-0.5 text-xs text-steel">{t("intro")}</p>
      </div>
      <div>
        <label htmlFor="lead-name" className="mb-1 block text-xs font-semibold text-navy">
          {t("name")}
        </label>
        <input
          id="lead-name"
          name="name"
          required
          minLength={2}
          maxLength={100}
          placeholder={t("name")}
          autoComplete="name"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="lead-email" className="mb-1 block text-xs font-semibold text-navy">
          {t("email")}
        </label>
        <input
          id="lead-email"
          name="email"
          type="email"
          maxLength={200}
          placeholder={t("email")}
          autoComplete="email"
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="lead-phone" className="mb-1 block text-xs font-semibold text-navy">
          {t("phone")}
        </label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          maxLength={30}
          placeholder={t("phone")}
          autoComplete="tel"
          className={inputCls}
        />
      </div>
      {/* Hint por padrão; vira o erro de "falta contato" (role="alert" +
          vermelho) quando o submit falha por não ter nem e-mail nem
          telefone — antes esse caso mostrava a mensagem genérica de falha de
          rede/servidor, que confundia o motivo real. Limpa em qualquer
          mudança de campo (onChange do form, acima) ou no próximo submit. */}
      <p
        role={errorKind === "contact" ? "alert" : undefined}
        className={errorKind === "contact" ? "text-xs font-medium text-red-800" : "text-xs text-steel"}
      >
        {t("contactHint")}
      </p>
      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-navy/85">
        <input name="consent" type="checkbox" required className="mt-0.5" />
        <span>{t("consent")}</span>
      </label>
      {errorKind === "delivery" ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
          {t("error")}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting} className="h-9 px-4 text-sm">
          {submitting ? t("sending") : t("submit")}
        </Button>
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-steel underline-offset-2 hover:underline">
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
