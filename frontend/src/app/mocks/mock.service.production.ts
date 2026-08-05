import { Injectable } from '@angular/core';

/**
 * Production stand-in for {@link MockService}.
 *
 * The MirageJS-based mock server is a development-only tool. This stub is
 * swapped in via `fileReplacements` in the production build configuration so
 * that `miragejs` and its transitive dependencies are never referenced by the
 * production build — keeping them out of the bundle and out of the
 * `dependencies` required by `npm ci --omit=dev`.
 */
@Injectable({ providedIn: 'root' })
export class MockService {
  async mirageJsServer(): Promise<void> {
    // No-op in production: mocks are never started.
  }
}
