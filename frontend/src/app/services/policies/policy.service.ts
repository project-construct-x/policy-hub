import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env';
import { Policy, CreatePolicyRequest, UpdatePolicyRequest } from '@shared/types/policy.model';
import { Page, PageRequest } from '@shared/types/page.model';
import { normalizePage } from '@services/http/page.helper';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backendUrl}/v1/policies`;

  private pageParams(request: PageRequest): HttpParams {
    let params = new HttpParams();
    if (request.page !== undefined) params = params.set('page', request.page);
    if (request.size !== undefined) params = params.set('size', request.size);
    if (request.sort !== undefined) params = params.set('sort', request.sort);
    return params;
  }

  /**
   * IDs stammen aus `paramMap.get('id')` und sind damit Eingabe: Angulars UrlSerializer
   * dekodiert `%2F`/`%2E`, sodass eine ID `/` und `..` enthalten kann. Ohne Kodierung würde
   * der Browser den fertigen Pfad normalisieren (`…/policies/../../actuator` → `/api/actuator`)
   * und der Request die Policies-Collection verlassen — same-origin und mit den Credentials
   * des Nutzers. Deshalb geht jede ID durch `encodeURIComponent`.
   */
  private resourceUrl(id: string): string {
    return `${this.baseUrl}/${encodeURIComponent(id)}`;
  }

  getPolicyPage(request: PageRequest = {}): Observable<Page<Policy>> {
    return this.http
      .get<Page<Policy>>(this.baseUrl, { params: this.pageParams(request) })
      .pipe(map((body) => normalizePage<Policy>(body)));
  }

  getPolicyById(id: string): Observable<Policy> {
    return this.http.get<Policy>(this.resourceUrl(id));
  }

  createPolicy(request: CreatePolicyRequest): Observable<Policy> {
    return this.http.post<Policy>(this.baseUrl, request);
  }

  updatePolicy(id: string, request: UpdatePolicyRequest): Observable<Policy> {
    return this.http.put<Policy>(this.resourceUrl(id), request);
  }

  deletePolicy(id: string): Observable<void> {
    return this.http.delete<void>(this.resourceUrl(id));
  }
}
