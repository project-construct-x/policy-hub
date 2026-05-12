import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Policy, CreatePolicyRequest, UpdatePolicyRequest } from '@shared/types/policy.model';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backendUrl}/v1/policies`;

  getAllPolicies(): Observable<Policy[]> {
    return this.http.get<Policy[]>(this.baseUrl);
  }

  getPolicyById(id: string): Observable<Policy> {
    return this.http.get<Policy>(`${this.baseUrl}/${id}`);
  }

  createPolicy(request: CreatePolicyRequest): Observable<Policy> {
    return this.http.post<Policy>(this.baseUrl, request);
  }

  updatePolicy(id: string, request: UpdatePolicyRequest): Observable<Policy> {
    return this.http.put<Policy>(`${this.baseUrl}/${id}`, request);
  }

  deletePolicy(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
