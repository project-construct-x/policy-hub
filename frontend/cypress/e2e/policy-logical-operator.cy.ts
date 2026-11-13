/// <reference types="cypress" />

// Verknüpfung der Bedingungen (UND/ODER): Auswahl im Builder, Darstellung im Detail,
// ODRL-Ausgabe (`odrl:and` / `odrl:or`) und korrektes Laden beim Bearbeiten.
// Mirage-State lebt nur innerhalb einer Seiten-Session → Verifikation per In-App-Navigation.

// bim-koordination-q2-2027: CONTRACT, PARTICIPANT_DID + DATE_RANGE (2027), ODER-verknüpft.
// Zeitraum in der Zukunft, damit das Speichern im Editor nicht blockiert ist.
const OR_POLICY_ID = '00000000-0000-0000-0000-000000000006';

describe('Policy – Verknüpfung der Bedingungen (UND/ODER)', () => {
  it('zeigt die Auswahl erst ab zwei Bedingungen, mit UND als Standard', () => {
    cy.visitWithMode('/policies/new', 'few');
    cy.getByCy('category-access').click();

    cy.getByCy('palette-PARTICIPANT_DID').click();
    cy.getByCy('logical-operator-AND').should('not.exist');

    cy.getByCy('palette-DATE_RANGE').click();
    cy.getByCy('logical-operator-AND').should('have.attr', 'aria-checked', 'true');
    cy.getByCy('logical-operator-OR').should('have.attr', 'aria-checked', 'false');
    cy.getByCy('logic-connector').should('have.text', 'UND');
  });

  it('wechselt per Pfeiltaste zwischen UND und ODER (Radiogroup-Muster)', () => {
    cy.visitWithMode('/policies/new', 'few');
    cy.getByCy('category-access').click();
    cy.getByCy('palette-PARTICIPANT_DID').click();
    cy.getByCy('palette-DATE_RANGE').click();

    cy.getByCy('logical-operator-AND').focus().trigger('keydown', { key: 'ArrowRight' });
    cy.getByCy('logical-operator-OR')
      .should('have.attr', 'aria-checked', 'true')
      .and('have.attr', 'tabindex', '0')
      .and('have.focus');
    cy.getByCy('logical-operator-AND').should('have.attr', 'tabindex', '-1');
  });

  it('erstellt eine ODER-Policy und gibt sie als odrl:or aus', () => {
    const newId = 'e2e-oder-policy';

    cy.visitWithMode('/policies/new', 'few');
    cy.getByCy('policyId-input').type(newId);
    cy.getByCy('category-access').click();
    cy.getByCy('palette-PARTICIPANT_DID').click();
    cy.getByCy('participant-did-input').type('did:web:e2e.example{enter}');
    cy.getByCy('palette-DATE_RANGE').click();
    // Einen Monat weiterblättern, damit beide Tage sicher in der Zukunft liegen.
    cy.getByCy('daterange-start-field').click();
    cy.waitForDatepickerOpen();
    cy.get('.mat-calendar-next-button').click();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(0).click();
    cy.waitForDatepickerClosed();
    cy.getByCy('daterange-end-field').click();
    cy.waitForDatepickerOpen();
    cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').eq(1).click();
    cy.waitForDatepickerClosed();
    cy.getByCy('logical-operator-OR').click();
    cy.getByCy('logic-connector').should('have.text', 'ODER');

    cy.getByCy('submit-policy').click();

    cy.getByCy('policy-title').should('have.text', `con-x-ph-${newId}`);
    cy.getByCy('logic-connector').should('have.text', 'ODER');
    cy.getByCy('legal-text').should('contain', 'mindestens eine der folgenden Voraussetzungen');

    cy.getByCy('odrl-panel-header').click();
    // Der Zeitraum steht als inneres odrl:and im odrl:or (siehe nächsten Test).
    cy.getByCy('odrl-json').should('contain', '"odrl:or"').and('contain', 'edc:connector');
  });

  it('gibt bei ODER einen Zeitraum als verschachteltes odrl:and aus', () => {
    cy.visitWithMode(`/policies/${OR_POLICY_ID}`, 'few');

    cy.getByCy('logic-connector').should('have.length', 1).and('have.text', 'ODER');
    cy.getByCy('odrl-panel-header').click();
    cy.getByCy('odrl-json')
      .should('contain', '"odrl:or"')
      .and('contain', '"odrl:and"')
      .and('contain', 'DataUsageStartDate')
      .and('contain', 'DataUsageEndDate');
  });

  it('lädt eine ODER-Policy korrekt in den Editor und speichert den Wechsel auf UND', () => {
    cy.visitWithMode(`/policies/${OR_POLICY_ID}/edit`, 'few');

    cy.getByCy('logical-operator-OR').should('have.attr', 'aria-checked', 'true');
    cy.getByCy('logic-connector').first().should('have.text', 'ODER');

    cy.getByCy('logical-operator-AND').click();
    cy.getByCy('submit-policy').click();

    cy.location('pathname').should('eq', `/policies/${OR_POLICY_ID}`);
    cy.getByCy('logic-connector').first().should('have.text', 'UND');
    cy.getByCy('odrl-panel-header').click();
    cy.getByCy('odrl-json').should('contain', '"odrl:and"').and('not.contain', '"odrl:or"');
  });
});
