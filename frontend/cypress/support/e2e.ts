// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// ---------------------------------------------------------------------------
// Diagnostics for CI-only failures.
//
// A screenshot only ever shows the symptom ("page is empty"). The cause is
// usually a request that failed or an exception in the browser console —
// neither of which is visible in a PNG, and neither of which reaches the CI
// terminal on its own (Cypress.log() only feeds the GUI command log).
//
// So collect both during the test and, only when it failed, flush them to
// stdout via the `log` task registered in cypress.config.ts.
//
// Note on the intercept: MirageJS patches XMLHttpRequest inside the browser,
// so anything it handles never reaches the network and never shows up here.
// Every entry that does show up therefore means a request escaped the mock —
// which is the failure mode this is meant to surface.
//
// Recorded when the request goes out, not when a response arrives: in mock
// mode backendUrl points at localhost:8080, where nothing is listening, so an
// escaped call dies with a connection error and never produces a response at
// all. The status is appended later if one does come back.
// ---------------------------------------------------------------------------

const consoleErrors: string[] = [];
const escapedRequests: string[] = [];

Cypress.on('window:before:load', (win) => {
  const original = win.console.error.bind(win.console);
  win.console.error = (...args: unknown[]): void => {
    consoleErrors.push(args.map(String).join(' '));
    original(...args);
  };
});

beforeEach(() => {
  consoleErrors.length = 0;
  escapedRequests.length = 0;

  cy.intercept('**/api/**', (req) => {
    const index = escapedRequests.push(`${req.method} ${req.url} (no response)`) - 1;
    req.on('response', (res) => {
      escapedRequests[index] = `${req.method} ${req.url} -> ${res.statusCode}`;
    });
  });
});

afterEach(function () {
  if (this.currentTest?.state !== 'failed') {
    return;
  }

  const lines = [
    ...escapedRequests.map((entry) => `  [escaped-mock] ${entry}`),
    ...consoleErrors.map((entry) => `  [console]      ${entry}`),
  ];

  if (lines.length === 0) {
    return;
  }

  cy.task(
    'log',
    `\n  Browser diagnostics for "${this.currentTest.title}":\n${lines.join('\n')}\n`,
    { log: false },
  );
});
