/// <reference types="cypress" />

// Custom Cypress-Commands für die Policy-Hub-E2E-Tests.
// Alle Tests laufen gegen den MirageJS-Mock-Modus (`npm start`), unabhängig vom Backend.

export type PolicyMockMode = 'empty' | 'few' | 'many';

/** localStorage-Key, über den `mocks/data/policies/mocked-policies.ts` die Datensatzgröße steuert. */
const MOCK_MODE_KEY = 'mock-policy-mode';

/**
 * Selektiert ein Element über sein `data-cy`-Attribut.
 * Bevorzugte Methode, um Tests von CSS-Klassen und i18n-Text zu entkoppeln.
 */
Cypress.Commands.add('getByCy', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`);
});

/**
 * Besucht eine Route und setzt zuvor den Mock-Datensatz-Modus deterministisch
 * (`empty` / `few` / `many`) — ohne den UI-Switcher zu bedienen.
 * Mirage erzeugt seinen In-Memory-State beim Laden aus diesem Modus.
 */
Cypress.Commands.add('visitWithMode', (path: string, mode: PolicyMockMode) => {
  return cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem(MOCK_MODE_KEY, mode);
    },
  });
});

/**
 * Wartet, bis ein geöffneter Datepicker seine Öffnungs-Animation beendet hat. Material ignoriert
 * `close()`, solange die Animation läuft (`mat-datepicker-content-animating`): Ein zu früher Klick
 * auf einen Tag übernimmt zwar das Datum, der Picker bleibt aber offen und blockiert den nächsten
 * Klick. Vor jedem Klick in den Kalender aufrufen.
 */
Cypress.Commands.add('waitForDatepickerOpen', () => {
  cy.get('.mat-datepicker-content').should('be.visible');
  cy.get('.mat-datepicker-content-animating').should('not.exist');
});

/**
 * Wartet, bis der Datepicker nach einer Auswahl vollständig entfernt ist. Bis dahin liegt sein
 * Overlay-Backdrop über der Seite und fängt den nächsten Klick ab.
 */
Cypress.Commands.add('waitForDatepickerClosed', () => {
  cy.get('.mat-datepicker-content').should('not.exist');
  cy.get('.cdk-overlay-backdrop').should('not.exist');
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** `cy.get('[data-cy="..."]')`-Kurzform. */
      getByCy(selector: string): Chainable<JQuery<HTMLElement>>;
      /** Besucht `path` mit vorab gesetztem Mock-Datensatz-Modus. */
      visitWithMode(path: string, mode: PolicyMockMode): Chainable<Cypress.AUTWindow>;
      /** Wartet, bis der geöffnete Datepicker fertig animiert und klickbar ist. */
      waitForDatepickerOpen(): Chainable<void>;
      /** Wartet, bis der Datepicker samt Overlay-Backdrop geschlossen ist. */
      waitForDatepickerClosed(): Chainable<void>;
    }
  }
}
