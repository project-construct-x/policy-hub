import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

/**
 * Protokolliert fehlgeschlagene HTTP-Aufrufe an genau einer Stelle.
 *
 * Vorher verwarfen die Fehler-Callbacks der Seiten ihren `HttpErrorResponse` vollständig
 * (`error: () => …`): Statuscode, Methode und Ziel gingen verloren, und wiederholt
 * fehlschlagende Zugriffe hinterließen clientseitig keinerlei Spur.
 *
 * Geloggt werden ausschließlich Metadaten — nie der Response-Body und nie der Request-Body.
 * Beide können fachliche Inhalte enthalten (Policy-IDs, Rechtstexte) und haben in der
 * Browser-Konsole nichts zu suchen.
 *
 * Der Fehler wird unverändert weitergereicht; die Nutzer-Meldung bleibt in der Verantwortung
 * des Aufrufers (siehe `httpErrorMessageKey`), damit es bei genau einer Meldung bleibt.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    tap({
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          console.error(
            `[http] ${req.method} ${req.urlWithParams} → ${error.status} ${error.statusText}`,
          );
        }
      },
    }),
  );
