import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env';

/**
 * Das Backend sichert `/api/**` per HTTP Basic — ein Provisorium bis zum echten
 * Construct-X-Auth-Verfahren (siehe CLAUDE.md §4). Ohne mitgeschickte Credentials scheitert
 * jeder Request mit 401, sobald `useMocks` aus ist.
 */
export const basicAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const credentials = environment.devBasicAuth;
  if (!credentials || !req.url.startsWith(environment.backendUrl)) {
    return next(req);
  }

  const encoded = btoa(`${credentials.username}:${credentials.password}`);
  return next(req.clone({ setHeaders: { Authorization: `Basic ${encoded}` } }));
};
