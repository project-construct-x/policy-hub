import { describe, expect, it, vi, afterEach } from 'vitest';

import { HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

import { basicAuthInterceptor } from './basic-auth.interceptor';
import { environment } from '@env';

describe('basicAuthInterceptor', () => {
  afterEach(() => {
    delete environment.devBasicAuth;
  });

  function runInterceptor(url: string) {
    const req = new HttpRequest('GET', url);
    const next: HttpHandlerFn = vi.fn(() => of(new HttpResponse()));
    basicAuthInterceptor(req, next);
    return (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as HttpRequest<unknown>;
  }

  it('hängt den Authorization-Header für eine Backend-URL mit gesetzten Credentials an', () => {
    environment.devBasicAuth = { username: 'admin', password: 'admin' };

    const forwarded = runInterceptor(`${environment.backendUrl}/v1/policies`);

    expect(forwarded.headers.get('Authorization')).toBe(`Basic ${btoa('admin:admin')}`);
  });

  it('hängt keinen Header für eine Nicht-Backend-URL an', () => {
    environment.devBasicAuth = { username: 'admin', password: 'admin' };

    const forwarded = runInterceptor('/assets/i18n/de.json');

    expect(forwarded.headers.has('Authorization')).toBe(false);
  });

  it('hängt keinen Header an, wenn keine Dev-Credentials konfiguriert sind (Prod-Fall)', () => {
    environment.devBasicAuth = undefined;

    const forwarded = runInterceptor(`${environment.backendUrl}/v1/policies`);

    expect(forwarded.headers.has('Authorization')).toBe(false);
  });
});
