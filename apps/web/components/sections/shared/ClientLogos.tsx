import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { clients } from "@/lib/clients";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

type ClientLogosProps = {
  /** "band": full section with heading (Consulting). "strip": slim row (Home). */
  variant?: "band" | "strip";
};

function LogoWall({ dense = false }: { dense?: boolean }) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-y-6 ${
        dense ? "gap-x-8 sm:gap-x-10" : "gap-x-10 sm:gap-x-14"
      }`}
    >
      {clients.map(({ key, name, logo }) => (
        <li key={key} className="flex items-center">
          {logo ? (
            <Image
              src={`/clients/${logo}`}
              alt={name}
              width={140}
              height={40}
              className={`w-auto opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0 ${
                dense ? "h-6 sm:h-7" : "h-7 sm:h-9"
              }`}
            />
          ) : (
            <span className="text-lg font-extrabold tracking-wide text-steel">
              {name}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Grayscale wall of companies the team has shipped projects for. */
export async function ClientLogos({ variant = "band" }: ClientLogosProps) {
  const t = await getTranslations("clients");

  if (variant === "strip") {
    return (
      <section className="border-b border-navy/5 bg-canvas py-10">
        <Container>
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.22em] text-steel">
            {t("stripTitle")}
          </p>
          <LogoWall dense />
        </Container>
      </section>
    );
  }

  return (
    <section className="bg-canvas py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={t("kicker")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-12">
          <LogoWall />
        </div>
        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-relaxed text-steel">
          {t("disclaimer")}
        </p>
      </Container>
    </section>
  );
}
