import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 900,
    // Recording costs encoding time on every run, which is only worth paying
    // where the artifact can actually be looked at afterwards (see the
    // upload-artifact step in .github/workflows/test.yml).
    video: !!process.env['CI'],
    // start-server-and-test only waits for the dev server to answer on :4200,
    // which happens before Angular has compiled the lazy route chunks. On a
    // cold cache (always the case in CI) the first navigation into the policy
    // editor can exceed the 4s default and fail the spec.
    defaultCommandTimeout: 10000,
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents(on) {
      // Bridges browser-side diagnostics (see cypress/support/e2e.ts) to the
      // terminal. Cypress.log() only feeds the GUI command log and would stay
      // invisible in `cypress run`, so a task is the only way to get this into
      // the CI output.
      on('task', {
        log(message: string): null {
          // eslint-disable-next-line no-console
          console.log(message);
          return null;
        },
      });
    },
  },
});
