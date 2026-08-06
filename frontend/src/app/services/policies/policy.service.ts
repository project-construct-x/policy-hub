import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Policy, CreatePolicyRequest, UpdatePolicyRequest } from '@shared/types/policy.model';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backendUrl}/v1/policies`;

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

  getAllPolicies(): Observable<Policy[]> {
    return this.http.get<Policy[]>(this.baseUrl);
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
