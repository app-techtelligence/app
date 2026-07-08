import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/site-config";
import { WhatsAppIcon } from "@/components/ui/icons";

/** Floating WhatsApp button — primary conversion path for the Brazilian audience. */
export async function WhatsAppFloat() {
  const t = await getTranslations("common");

  return (
    <a
      href={whatsappLink(t("cta.whatsappMessage"))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsappFloat.label")}
      className="fixed bottom-5 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
