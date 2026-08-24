import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpClient, HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { PolicyService } from './policy.service';
import { emptyPage } from '@services/http/page.helper';

/**
 * Der Route-Parameter `id` kommt aus `paramMap.get('id')` und ist damit reine Eingabe:
 * Angulars `DefaultUrlSerializer` dekodiert `%2F` zu `/` und `%2E` zu `.`, nachdem er den
 * Pfad in Segmente zerlegt hat. `/policies/..%2F..%2Factuator%2Fenv` liefert also
 * `id = '../../actuator/env'`. Ohne Kodierung baut der Service daraus
 * `/api/v1/policies/../../actuator/env`, was der Browser vor dem Absenden zu
 * `/api/actuator/env` normalisiert — der Request verlässt die Policies-Collection.
 *
 * Invariante: egal welche ID hereinkommt, der aufgelöste Pfad muss unterhalb von
 * `<backendUrl>/v1/policies/` bleiben.
 */
describe('PolicyService — Pfad-Konstruktion', () => {
  const TRAVERSAL_ID = '../../actuator/env';

  // Signaturen als Generic statt als Parameterliste: so ist `mock.calls` typisiert,
  // ohne ungenutzte Parameter zu deklarieren (ESLint `no-unused-vars`).
  function makeHttp() {
    return {
      get: vi.fn<(url: string, options?: { params?: HttpParams }) => Observable<object>>(() =>
        of({}),
      ),
      post: vi.fn<(url: string, body: unknown) => Observable<object>>(() => of({})),
      put: vi.fn<(url: string, body: unknown) => Observable<object>>(() => of({})),
      delete: vi.fn<(url: string) => Observable<undefined>>(() => of(undefined)),
    };
  }

  let http: ReturnType<typeof makeHttp>;
  let service: PolicyService;

  beforeEach(() => {
    http = makeHttp();
    TestBed.configureTestingModule({ providers: [{ provide: HttpClient, useValue: http }] });
    service = TestBed.inject(PolicyService);
  });

  /** Bildet die Pfad-Normalisierung nach, die der Browser vor dem Absenden vornimmt. */
  function resolvedPath(url: string): string {
    return new URL(url, 'https://policy-hub.example').pathname;
  }

  function collectionPath(): string {
    return resolvedPath(service['baseUrl']) + '/';
  }

  it('getPolicyById kodiert die ID und bleibt in der Policies-Collection', () => {
    service.getPolicyById(TRAVERSAL_ID).subscribe();

    const url = http.get.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent(TRAVERSAL_ID));
    expect(resolvedPath(url).startsWith(collectionPath())).toBe(true);
  });

  it('updatePolicy kodiert die ID und bleibt in der Policies-Collection', () => {
    service
      .updatePolicy(TRAVERSAL_ID, {
        policyId: 'x',
        category: 'ACCESS',
        constraints: [],
        legalText: '',
      })
      .subscribe();

    const url = http.put.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent(TRAVERSAL_ID));
    expect(resolvedPath(url).startsWith(collectionPath())).toBe(true);
  });

  it('deletePolicy kodiert die ID und bleibt in der Policies-Collection', () => {
    service.deletePolicy(TRAVERSAL_ID).subscribe();

    const url = http.delete.mock.calls[0][0];
    expect(url).toContain(encodeURIComponent(TRAVERSAL_ID));
    expect(resolvedPath(url).startsWith(collectionPath())).toBe(true);
  });

  it('lässt eine unauffällige UUID unverändert', () => {
    const id = '00000000-0000-0000-0000-000000000001';
    service.getPolicyById(id).subscribe();

    const url = http.get.mock.calls[0][0];
    expect(url.endsWith(`/v1/policies/${id}`)).toBe(true);
  });
});

describe('PolicyService — getPolicyPage', () => {
  function makeHttp() {
    return {
      get: vi.fn<(url: string, options?: { params?: HttpParams }) => Observable<object>>(() =>
        of({}),
      ),
    };
  }

  let http: ReturnType<typeof makeHttp>;
  let service: PolicyService;

  beforeEach(() => {
    http = makeHttp();
    TestBed.configureTestingModule({ providers: [{ provide: HttpClient, useValue: http }] });
    service = TestBed.inject(PolicyService);
  });

  it('setzt page/size/sort als HttpParams, wenn angegeben', () => {
    service.getPolicyPage({ page: 2, size: 5, sort: 'updatedAt,desc' }).subscribe();

    const [, options] = http.get.mock.calls[0];
    const params = options?.params;
    expect(params?.get('page')).toBe('2');
    expect(params?.get('size')).toBe('5');
    expect(params?.get('sort')).toBe('updatedAt,desc');
  });

  it('lässt nicht angegebene Parameter weg', () => {
    service.getPolicyPage().subscribe();

    const [, options] = http.get.mock.calls[0];
    const params = options?.params;
    expect(params?.keys()).toEqual([]);
  });

  it('normalisiert einen unbrauchbaren Response-Body zu einer leeren Seite', () => {
    http.get.mockReturnValueOnce(of({ notAPage: true }));

    let result: unknown;
    service.getPolicyPage().subscribe((page) => (result = page));

    expect(result).toEqual(emptyPage());
  });
});
