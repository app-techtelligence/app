import { getTranslations } from "next-intl/server";

/**
 * Concrete claims in mono, directly under the hero copy (spec §5). This is the
 * element that answers "the site doesn't convey authority" — the shader does
 * not. Lives on navy only: `signal` is illegible on light surfaces.
 */
export async function ProofStrip() {
  const t = await getTranslations("home.proof");
  const items = [t("experience"), t("stack"), t("compliance")];

  return (
    <ul className="mt-12 flex flex-col gap-3 border-t border-white/12 pt-6 font-mono text-xs tracking-[0.05em] text-steel-light sm:flex-row sm:flex-wrap sm:gap-x-9">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
