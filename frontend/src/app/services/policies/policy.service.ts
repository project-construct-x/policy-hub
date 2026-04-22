import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';
import { Policy, CreatePolicyRequest, UpdatePolicyRequest } from '@shared/types/policy.model';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backendUrl}/v1/policies`;

  getAll(): Observable<Policy[]> {
    return this.http.get<Policy[]>(this.baseUrl);
  }

  getById(id: string): Observable<Policy> {
    return this.http.get<Policy>(`${this.baseUrl}/${id}`);
  }

  create(request: CreatePolicyRequest): Observable<Policy> {
    return this.http.post<Policy>(this.baseUrl, request);
  }

  update(id: string, request: UpdatePolicyRequest): Observable<Policy> {
    return this.http.put<Policy>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
