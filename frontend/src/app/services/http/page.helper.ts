import { Page } from '@shared/types/page.model';

/** Leere, sicher iterierbare Seite — Fallback für einen Response ohne verwertbaren Inhalt. */
export function emptyPage<T>(): Page<T> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 0,
    number: 0,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
  };
}

/**
 * Ein HTTP-Response ist Eingabe: `http.get<Page<Policy>>()` prüft zur Laufzeit nichts, der
 * generische Typ ist nur ein Compile-Zeit-Versprechen. Fehlt `content` oder ist es kein Array,
 * würde die Übersicht beim ersten `.filter()`/`.map()` auf dem Ergebnis abstürzen.
 */
export function normalizePage<T>(body: unknown): Page<T> {
  if (typeof body !== 'object' || body === null || !Array.isArray((body as Page<T>).content)) {
    return emptyPage<T>();
  }

  const page = body as Page<T>;
  const content = page.content;

  return {
    content,
    totalElements: typeof page.totalElements === 'number' ? page.totalElements : content.length,
    totalPages: typeof page.totalPages === 'number' ? page.totalPages : content.length > 0 ? 1 : 0,
    size: typeof page.size === 'number' ? page.size : content.length,
    number: typeof page.number === 'number' ? page.number : 0,
    numberOfElements:
      typeof page.numberOfElements === 'number' ? page.numberOfElements : content.length,
    first: typeof page.first === 'boolean' ? page.first : true,
    last: typeof page.last === 'boolean' ? page.last : true,
    empty: typeof page.empty === 'boolean' ? page.empty : content.length === 0,
  };
}
