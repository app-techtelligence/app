/**
 * Picks the localized variant of database content: the English column when
 * the user is on the English locale and a translation exists, otherwise the
 * PT-BR base column.
 */
export function localized(
  locale: string,
  base: string | null,
  en: string | null | undefined,
): string | null {
  return locale === "en" && en ? en : base;
}
