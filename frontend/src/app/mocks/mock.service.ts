import { Injectable } from '@angular/core';
import type { Server as MirageServer } from 'miragejs';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class MockService {
  private mirageServer?: MirageServer;

  async mirageJsServer(): Promise<MirageServer> {
    // Dynamically import MirageJS and mock data so they are code-split into a
    // lazy chunk and never included in the production bundle.
    const { Server, Response } = await import('miragejs');
    const {
      getMockedPolicyPage,
      getMockedPolicyById,
      createMockedPolicy,
      updateMockedPolicy,
      deleteMockedPolicy,
    } = await import('./data/policies/mocked-policies');

    this.mirageServer = new Server({
      routes(): void {
        // GET policies (paginated — mirrors the Spring `Page<T>` envelope)
        this.get(`${environment.backendUrl}/v1/policies`, (_schema, request) => {
          const { page, size, sort } = request.queryParams;
          return getMockedPolicyPage({
            page: page !== undefined ? Number(page) : undefined,
            size: size !== undefined ? Number(size) : undefined,
            sort: typeof sort === 'string' ? sort : undefined,
          });
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
