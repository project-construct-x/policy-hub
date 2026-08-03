import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 900,
    video: false,
    // start-server-and-test only waits for the dev server to answer on :4200,
    // which happens before Angular has compiled the lazy route chunks. On a
    // cold cache (always the case in CI) the first navigation into the policy
    // editor can exceed the 4s default and fail the spec.
    defaultCommandTimeout: 10000,
    retries: { runMode: 1, openMode: 0 },
  },
});
