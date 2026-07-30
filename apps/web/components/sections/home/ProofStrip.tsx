import { getTranslations } from "next-intl/server";

/**
 * Concrete claim in mono, directly under the hero copy (spec §5). This is the
 * element that answers "the site doesn't convey authority" — the shader does
 * not. Lives on navy only: `signal` is illegible on light surfaces.
 */
export async function ProofStrip() {
  const t = await getTranslations("home.proof");

  return (
    <p className="mt-12 border-t border-white/12 pt-6 font-mono text-xs tracking-[0.05em] text-steel-light text-shadow-halo-sm">
      {t("experience")}
    </p>
  );
}
