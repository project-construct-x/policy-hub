import { describe, expect, it } from 'vitest';

import { HttpErrorResponse } from '@angular/common/http';

import { HTTP_ERROR_KEYS, httpErrorMessageKey } from './http-error.helper';

const FALLBACK = 'policies.notifications.loadError';

function httpError(status: number): HttpErrorResponse {
  return new HttpErrorResponse({ status, statusText: 'x', url: '/api/v1/policies' });
}

describe('httpErrorMessageKey', () => {
  it('unterscheidet die Ursachen, die eine fachliche Meldung nicht ausdrücken kann', () => {
    expect(httpErrorMessageKey(httpError(0), FALLBACK)).toBe(HTTP_ERROR_KEYS.offline);
    expect(httpErrorMessageKey(httpError(401), FALLBACK)).toBe(HTTP_ERROR_KEYS.unauthorized);
    expect(httpErrorMessageKey(httpError(403), FALLBACK)).toBe(HTTP_ERROR_KEYS.forbidden);
    expect(httpErrorMessageKey(httpError(409), FALLBACK)).toBe(HTTP_ERROR_KEYS.conflict);
  });

  it('meldet 5xx generisch als Serverfehler', () => {
    for (const status of [500, 502, 503, 504]) {
      expect(httpErrorMessageKey(httpError(status), FALLBACK)).toBe(HTTP_ERROR_KEYS.server);
    }
  });

  it('überlässt 404 und sonstige 4xx der fachlichen Meldung des Aufrufers', () => {
    expect(httpErrorMessageKey(httpError(404), FALLBACK)).toBe(FALLBACK);
    expect(httpErrorMessageKey(httpError(400), FALLBACK)).toBe(FALLBACK);
    expect(httpErrorMessageKey(httpError(422), FALLBACK)).toBe(FALLBACK);
  });

  it('fällt bei Nicht-HTTP-Fehlern auf die fachliche Meldung zurück', () => {
    expect(httpErrorMessageKey(new TypeError('boom'), FALLBACK)).toBe(FALLBACK);
    expect(httpErrorMessageKey(undefined, FALLBACK)).toBe(FALLBACK);
    expect(httpErrorMessageKey('kaputt', FALLBACK)).toBe(FALLBACK);
  });
});
