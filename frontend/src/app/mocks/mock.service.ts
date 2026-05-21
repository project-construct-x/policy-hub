import { Injectable } from '@angular/core';
import { Server, Response } from 'miragejs';
import { environment } from '@env';
import {
  getMockedPolicies,
  getMockedPolicyById,
  createMockedPolicy,
  updateMockedPolicy,
  deleteMockedPolicy,
} from './data/policies/mocked-policies';

@Injectable({ providedIn: 'root' })
export class MockService {
  private mirageServer?: Server;

  mirageJsServer(): Server {
    console.log('[MockService] Starting MirageJS server...');
    console.log('[MockService] Intercepting:', environment.backendUrl);

    this.mirageServer = new Server({
      routes(): void {
        // GET all policies
        this.get(`${environment.backendUrl}/v1/policies`, () => {
          return getMockedPolicies();
        });

        // GET single policy
        this.get(`${environment.backendUrl}/v1/policies/:id`, (_schema, request) => {
          const id = request.params['id'];
          const policy = getMockedPolicyById(id);
          if (!policy) {
            return new Response(404, {}, { error: 'Policy nicht gefunden' });
          }
          return policy;
        });

        // CREATE policy
        this.post(`${environment.backendUrl}/v1/policies`, (_schema, request) => {
          const body = JSON.parse(request.requestBody);
          const created = createMockedPolicy(body);
          return new Response(201, {}, created);
        });

        // UPDATE policy
        this.put(`${environment.backendUrl}/v1/policies/:id`, (_schema, request) => {
          const id = request.params['id'];
          const body = JSON.parse(request.requestBody);
          const updated = updateMockedPolicy(id, body);
          if (!updated) {
            return new Response(404, {}, { error: 'Policy nicht gefunden' });
          }
          return updated;
        });

        // DELETE policy
        this.delete(`${environment.backendUrl}/v1/policies/:id`, (_schema, request) => {
          const id = request.params['id'];
          const deleted = deleteMockedPolicy(id);
          if (!deleted) {
            return new Response(404, {}, { error: 'Policy nicht gefunden' });
          }
          return new Response(204, {}, '');
        });

        // Passthrough for all other requests
        this.passthrough();
      },
    });

    return this.mirageServer;
  }
}
