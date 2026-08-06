import { HttpErrorResponse } from '@angular/common/http';

/**
 * i18n-Keys für Fehlerursachen, die eine fachliche Meldung nicht ausdrücken kann.
 *
 * „Policy konnte nicht geladen werden" ist die richtige Aussage bei einem 404 oder einem
 * unerwarteten Fehler — nicht aber, wenn die Anmeldung fehlt, die Berechtigung fehlt oder
 * der Server gar nicht erreichbar ist. In diesen Fällen ist die Ursache selbst die
 * hilfreichere Information.
 */
export const HTTP_ERROR_KEYS = {
  offline: 'httpError.offline',
  unauthorized: 'httpError.unauthorized',
  forbidden: 'httpError.forbidden',
  conflict: 'httpError.conflict',
  server: 'httpError.server',
} as const;

/**
 * Wählt den i18n-Key für einen fehlgeschlagenen HTTP-Aufruf.
 *
 * Bisher verwarfen alle Fehler-Callbacks ihren Parameter (`error: () => …`) und zeigten
 * dieselbe Meldung — 401, 403, 404 und 500 waren für Nutzer wie für Support ununterscheidbar.
 *
 * `fallbackKey` ist die fachliche Meldung des Aufrufers und bleibt für alles zuständig,
 * was sie besser beschreibt (insbesondere 404 und sonstige 4xx).
 */
export function httpErrorMessageKey(error: unknown, fallbackKey: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallbackKey;

  switch (error.status) {
    // Status 0: Verbindungsabbruch, DNS-/TLS-Fehler oder von CORS blockiert — es gab
    // keine Antwort, eine fachliche Meldung wäre hier irreführend.
    case 0:
      return HTTP_ERROR_KEYS.offline;
    case 401:
      return HTTP_ERROR_KEYS.unauthorized;
    case 403:
      return HTTP_ERROR_KEYS.forbidden;
    case 409:
      return HTTP_ERROR_KEYS.conflict;
    default:
      return error.status >= 500 ? HTTP_ERROR_KEYS.server : fallbackKey;
  }
}
