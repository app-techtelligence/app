"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { Turnstile } from "@marsidev/react-turnstile";
import { Link } from "@/i18n/navigation";
import { whatsappLink } from "@/lib/site-config";
import { CloseIcon } from "@/components/ui/icons";
import { ChatHttpError, pruneMessages, streamChat } from "@/lib/chat/client";
import type { ChatMessage } from "@/lib/schemas/chat";
import {
  CHAT_TOPICS,
  MAX_PAYLOAD_CHARS,
  MAX_USER_MESSAGE_CHARS,
  MAX_USER_MESSAGES,
  type ChatTopic,
} from "@/lib/chat/constants";
import { useChatSession } from "./useChatSession";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

// Estilo compartilhado dos avisos de estado (spec §7): vermelho só para o
// caso negativo (erro/limite atingido não é "erro", fica neutro).
const ERROR_BANNER_CLS =
  "mx-4 mb-3 rounded-md bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800";
const INFO_BANNER_CLS =
  "mx-4 mb-3 rounded-md bg-navy/5 px-3.5 py-2.5 text-sm font-medium text-navy";
const BANNER_ACTION_CLS =
  "mt-2 inline-block text-sm font-bold underline underline-offset-2 hover:no-underline";
const OUTCOME_LINK_CLS = "text-sm font-bold text-navy underline underline-offset-2";
const OUTCOME_MUTED_LINK_CLS = "text-sm text-steel underline underline-offset-2";

export type ChatPanelProps = { open: boolean; onClose: () => void };

type Ended = null | "limit" | "expired";
type ErrorKind = null | "unavailable" | "rateLimited";

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const t = useTranslations("chat");
  const locale = useLocale() as "pt-BR" | "en";
  const session = useChatSession(locale);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  /** Contexto exato (o `next` que falhou) para o retry reenviar — capturado no
   *  momento da falha, nunca re-derivado de `messages` (evita comer a resposta
   *  enlatada de um chip clicado depois do erro). Limpo no sucesso/restart. */
  const retryContextRef = useRef<ChatMessage[] | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: t("welcome") },
  ]);
  const [draft, setDraft] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [topic, setTopic] = useState<ChatTopic | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [ended, setEnded] = useState<Ended>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const [turnstileKey, setTurnstileKey] = useState(0); // remount no restart

  // Esc fecha o painel (mantido da casca da T9).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Auto-scroll a cada mensagem.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  const bumpUserCount = useCallback(() => {
    setUserCount((n) => {
      const next = n + 1;
      if (next >= MAX_USER_MESSAGES) setEnded("limit");
      return next;
    });
  }, []);

  function handleChip(chip: ChatTopic) {
    if (ended || streaming) return;
    // Limpa qualquer erro pendente de uma tentativa anterior — senão o banner
    // "unavailable" + Retry ficam presos na tela, e um Retry accionado depois
    // reaproveitaria o snapshot antigo em vez desta resposta enlatada nova.
    setErrorKind(null);
    retryContextRef.current = null;
    setTopic(chip);
    setMessages((m) => [
      ...m,
      { role: "user", content: t(`chips.${chip}`) },
      { role: "assistant", content: t(`canned.${chip}`) },
    ]);
    bumpUserCount();
  }

  /** Remove o turno assistant à direita SE ele continuar vazio — nunca chega
   *  a existir conteúdo parcial a preservar (a regra "mantém o parcial na
   *  tela" só vale quando HÁ parcial). Sem isto, um turno `content: ""` fica
   *  em `messages` para sempre e `chatMessageSchema` (min(1)) rejeita todo
   *  envio seguinte que o inclua — o widget trava e só "expired" reabre. */
  function dropEmptyTrailingAssistant() {
    setMessages((m) => {
      const last = m[m.length - 1];
      if (last?.role === "assistant" && last.content.trim().length === 0) return m.slice(0, -1);
      return m;
    });
  }

  /** Corre o pedido de streaming para um contexto já fechado (spec §5/§7).
   *  Usado tanto pelo envio normal quanto pelo retry (que reaproveita o
   *  mesmo contexto sem duplicar o turno do usuário nem o contador). */
  async function runStream(next: ChatMessage[], token: string) {
    setErrorKind(null);
    setMessages([...next, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const outcome = await streamChat(
        {
          sessionToken: token,
          locale,
          // Defesa em profundidade: nenhuma mensagem de conteúdo vazio/só
          // espaços chega ao payload, mesmo que `next` já devesse estar limpo
          // (ex.: um turno assistant vazio remanescente de uma falha anterior).
          messages: pruneMessages(
            next.filter((m) => m.content.trim().length > 0),
            MAX_PAYLOAD_CHARS,
          ),
        },
        (delta) =>
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + delta };
            return copy;
          }),
      );
      if (outcome === "error") {
        setErrorKind("unavailable"); // parcial fica na tela
        dropEmptyTrailingAssistant();
        retryContextRef.current = next;
      } else {
        retryContextRef.current = null;
      }
    } catch (error) {
      dropEmptyTrailingAssistant();
      retryContextRef.current = next;
      if (error instanceof ChatHttpError && error.status === 403) setEnded("expired");
      else if (error instanceof ChatHttpError && error.status === 429)
        setErrorKind("rateLimited");
      else setErrorKind("unavailable");
    } finally {
      setStreaming(false);
    }
  }

  async function handleSend(text: string) {
    const token = session.sessionToken;
    if (ended || streaming || !token) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    bumpUserCount();
    await runStream(next, token);
  }

  function handleRetry() {
    const token = session.sessionToken;
    // Reenvia o snapshot exato capturado no momento da falha (não re-deriva
    // de `messages`): se um chip foi clicado depois do erro, o último turno
    // assistant em `messages` é a resposta enlatada do chip, não o turno
    // vazio/parcial da tentativa que falhou — usar `messages` aqui comeria
    // essa resposta enlatada no reenvio.
    const context = retryContextRef.current;
    if (streaming || !token || !context) return;
    void runStream(context, token);
  }

  function handleRestart() {
    setMessages([{ role: "assistant", content: t("welcome") }]);
    setDraft("");
    setUserCount(0);
    setTopic(null);
    setEnded(null);
    setErrorKind(null);
    setTurnstileFailed(false);
    retryContextRef.current = null;
    session.reset();
    setTurnstileKey((k) => k + 1); // novo Turnstile → nova sessão
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    // Espelha o gate de handleSend: sem isto, Enter durante o streaming
    // (o textarea não é `disabled` nesse estado, só o botão) dispara o
    // submit, que limpava o rascunho antes do handleSend abortar — o texto
    // digitado desaparecia sem ser enviado.
    if (ended || streaming || !session.sessionToken) return;
    setDraft("");
    void handleSend(text);
  }

  function handleTextareaKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  // Turnstile falhou antes de a sessão ficar pronta: se já estava "ready",
  // um erro tardio do widget não derruba uma sessão que já funciona.
  const connectionFailed =
    session.state === "error" || (turnstileFailed && session.state !== "ready");
  // userCount >= MAX_USER_MESSAGES já implica ended === "limit" (bumpUserCount
  // seta os dois no mesmo render) — checagem redundante como cinto de segurança.
  const inputDisabled =
    ended !== null || session.state !== "ready" || userCount >= MAX_USER_MESSAGES;
  const sendDisabled = inputDisabled || streaming || draft.trim().length === 0;

  // Foco no textarea ao abrir o painel. O textarea fica `disabled` até a
  // sessão ficar pronta e focus() em um controlo disabled é um no-op — por
  // isso o efeito também depende de `inputDisabled`, reaplicando o foco
  // assim que o textarea é habilitado enquanto o painel já está aberto.
  // Nunca rouba o foco quando o painel está fechado.
  useEffect(() => {
    if (open && !inputDisabled) textareaRef.current?.focus();
  }, [open, inputDisabled]);

  function renderStatusBanner() {
    if (ended === "expired") {
      return (
        <div role="alert" className={ERROR_BANNER_CLS}>
          <p>{t("status.expired")}</p>
          <button type="button" onClick={handleRestart} className={BANNER_ACTION_CLS}>
            {t("status.restart")}
          </button>
        </div>
      );
    }
    if (ended === "limit") {
      return (
        <div role="status" className={INFO_BANNER_CLS}>
          <p>{t("status.limitReached")}</p>
        </div>
      );
    }
    if (errorKind === "rateLimited") {
      return (
        <div role="alert" className={ERROR_BANNER_CLS}>
          <p>{t("status.rateLimited")}</p>
        </div>
      );
    }
    if (errorKind === "unavailable") {
      return (
        <div role="alert" className={ERROR_BANNER_CLS}>
          <p>{t("status.unavailable")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleRetry} className={BANNER_ACTION_CLS}>
              {t("status.retry")}
            </button>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={OUTCOME_LINK_CLS}
            >
              {t("whatsapp.cta")}
            </a>
            <Link href="/contact" className={OUTCOME_MUTED_LINK_CLS}>
              {t("status.contactPage")}
            </Link>
          </div>
        </div>
      );
    }
    if (connectionFailed) {
      return (
        <div role="alert" className={ERROR_BANNER_CLS}>
          <p>{t("status.unavailable")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={OUTCOME_LINK_CLS}
            >
              {t("whatsapp.cta")}
            </a>
            <Link href="/contact" className={OUTCOME_MUTED_LINK_CLS}>
              {t("status.contactPage")}
            </Link>
          </div>
        </div>
      );
    }
    if (session.state !== "ready") {
      return (
        <div role="status" className={INFO_BANNER_CLS}>
          <p>{t("status.connecting")}</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={t("a11y.panel")}
      lang={locale}
      className="fixed inset-x-0 bottom-0 z-50 flex h-[85svh] flex-col overflow-hidden rounded-t-2xl border border-navy/10 bg-white shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:max-h-[80svh] sm:w-[380px] sm:rounded-2xl"
    >
      <header className="flex items-center justify-between bg-navy px-4 py-3 text-white">
        <div>
          <p className="text-sm font-extrabold tracking-wide">{t("title")}</p>
          <p className="text-xs text-steel-light">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("launcher.close")}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label={t("a11y.conversation")}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === "user" ? "bg-navy text-white" : "bg-canvas text-navy"
              }`}
            >
              {m.content.length > 0 ? (
                m.content
              ) : (
                <span className="inline-flex items-center gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/40 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/40 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/40" />
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {renderStatusBanner()}

      {ended === null ? (
        <div className="flex flex-wrap gap-2 border-t border-navy/10 px-4 pt-3">
          {CHAT_TOPICS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChip(chip)}
              disabled={streaming}
              className="rounded-full border border-navy/30 px-3 py-1.5 text-sm text-navy hover:bg-navy/5 disabled:pointer-events-none disabled:opacity-60"
            >
              {t(`chips.${chip}`)}
            </button>
          ))}
        </div>
      ) : null}

      {/* Desfechos sempre visíveis (spec §3/§7): WhatsApp + "prefiro ser contatado". */}
      <div className="flex flex-wrap items-center gap-4 border-t border-navy/10 px-4 py-3">
        <a
          href={whatsappLink(t(`whatsapp.templates.${topic ?? "outros"}`))}
          target="_blank"
          rel="noopener noreferrer"
          className={OUTCOME_LINK_CLS}
        >
          {t("whatsapp.cta")}
        </a>
        {/* LeadForm chega na Task 11 */}
        <button
          type="button"
          aria-disabled="true"
          onClick={(e) => e.preventDefault()}
          className={OUTCOME_MUTED_LINK_CLS}
        >
          {t("lead.cta")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-navy/10 p-3">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          maxLength={MAX_USER_MESSAGE_CHARS}
          disabled={inputDisabled}
          placeholder={t("input.placeholder")}
          aria-label={t("input.placeholder")}
          rows={2}
          className="flex-1 resize-none rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy placeholder:text-steel/70 focus:border-navy disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sendDisabled}
          className="h-9 shrink-0 rounded-md bg-navy px-4 text-sm font-bold text-white hover:bg-navy-deep disabled:pointer-events-none disabled:opacity-60"
        >
          {t("input.send")}
        </button>
      </form>

      <Turnstile
        key={turnstileKey}
        siteKey={TURNSTILE_SITE_KEY}
        options={{ appearance: "interaction-only" }}
        onSuccess={session.exchange}
        onError={() => {
          if (session.state !== "ready") setTurnstileFailed(true);
        }}
      />
    </div>
  );
}
