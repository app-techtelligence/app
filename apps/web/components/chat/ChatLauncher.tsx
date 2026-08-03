"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { whatsappLink } from "@/lib/site-config";
import { ChatBubbleIcon } from "@/components/ui/icons";

// O painel só é baixado no primeiro clique (spec §3): a página de marketing
// continua 100% estática e o Lighthouse não paga pelo chat.
// Se o import dinâmico falhar (rede), cai no painel de indisponibilidade
// (spec §7) — nunca um erro técnico na cara da pessoa.
const ChatPanel = dynamic(
  () =>
    import("./ChatPanel").then(
      (m) => m.ChatPanel,
      () => UnavailablePanel,
    ),
  { ssr: false },
);

// Store que nunca notifica — só serve para diferenciar o snapshot do
// servidor (false) do snapshot do cliente (true) via useSyncExternalStore.
function subscribeNoop() {
  return () => {};
}

function UnavailablePanel({ onClose }: { onClose: () => void }) {
  const t = useTranslations("chat");
  return (
    <div
      role="dialog"
      aria-label={t("a11y.panel")}
      className="fixed bottom-20 right-5 z-50 w-[320px] rounded-2xl border border-navy/10 bg-white p-4 shadow-2xl"
    >
      <p className="text-sm text-navy">{t("status.unavailable")}</p>
      <div className="mt-3 flex items-center gap-3">
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-navy underline underline-offset-2"
        >
          {t("whatsapp.cta")}
        </a>
        <Link href="/contact" className="text-sm text-steel underline underline-offset-2">
          {t("status.contactPage")}
        </Link>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 text-xs font-semibold text-steel hover:underline"
      >
        {t("launcher.close")}
      </button>
    </div>
  );
}

export function ChatLauncher() {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  // Só renderiza após a hidratação: sem JavaScript o botão não aparece
  // (spec §7) — melhor nenhum botão do que um botão morto. useSyncExternalStore
  // (em vez de useEffect + setState) entrega o mesmo "null até montar" sem o
  // cascading-render que o react-hooks/set-state-in-effect (eslint-plugin-
  // react-hooks 7) rejeita: getServerSnapshot=false evita mismatch de
  // hidratação, e o re-render pós-hidratação usa getSnapshot=true.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!mounted) return null;

  return (
    <>
      {loaded ? (
        <div hidden={!open}>
          <ChatPanel
            onClose={() => {
              setOpen(false);
              buttonRef.current?.focus();
            }}
          />
        </div>
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
        aria-label={t("launcher.open")}
        aria-expanded={open}
        className="fixed bottom-20 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-navy text-white shadow-lg transition-transform hover:scale-105"
      >
        <ChatBubbleIcon className="h-6 w-6" />
      </button>
    </>
  );
}
