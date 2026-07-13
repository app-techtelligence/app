/**
 * Matching helpers for the course-page lesson search. Case- and
 * accent-insensitive so "licao" finds "Lição" — students type fast and
 * PT-BR keyboards make diacritics inconsistent.
 */

export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** True when any field contains the query. An empty query matches everything. */
export function matchesQuery(
  query: string,
  ...fields: Array<string | null | undefined>
): boolean {
  const q = normalizeForSearch(query);
  if (!q) return true;
  return fields.some((field) =>
    field ? normalizeForSearch(field).includes(q) : false,
  );
}
