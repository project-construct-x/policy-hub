/// <reference types="cypress" />

// Kernablauf: bestehende Policy bearbeiten und die Änderung verifizieren.

// zugriff-konsortium-mitglieder: ACCESS mit einer MEMBERSHIP-Bedingung.
const POLICY_ID = '00000000-0000-0000-0000-000000000002';
const ORIGINAL_SLUG = 'zugriff-konsortium-mitglieder';

describe('Policy – Bearbeiten', () => {
  it('ändert die policyId und zeigt die aktualisierte Policy im Detail', () => {
    const updatedId = 'zugriff-konsortium-mitglieder-v2';

    cy.visitWithMode(`/policies/${POLICY_ID}/edit`, 'few');

    // Vorbefüllung prüfen (Präfix steht fest vor dem Feld, das Feld enthält nur den Rest), dann überschreiben.
    cy.getByCy('policyId-prefix').should('have.text', 'con-x-ph-');
    cy.getByCy('policyId-input').should('have.value', ORIGINAL_SLUG);
    cy.getByCy('policyId-input').clear().type(updatedId);

    cy.getByCy('submit-policy').click();

    cy.getByCy('policy-title').should('have.text', `con-x-ph-${updatedId}`);
    cy.getByCy('snackbar-success').should('exist');
    cy.location('pathname').should('eq', `/policies/${POLICY_ID}`);
  });

  it('fügt eine weitere Bedingung hinzu (FRAMEWORK_AGREEMENT)', () => {
    cy.visitWithMode(`/policies/${POLICY_ID}/edit`, 'few');

    cy.getByCy('palette-FRAMEWORK_AGREEMENT').click();
    cy.getByCy('constraint-card-FRAMEWORK_AGREEMENT').should('exist');

    cy.getByCy('submit-policy').click();

    cy.getByCy('policy-title').should('exist');
    cy.get('app-constraint-card').should('have.length', 2); // MEMBERSHIP + FRAMEWORK_AGREEMENT
  });

  it('verlängert bei laufendem Zeitraum nur das Enddatum, das Startdatum bleibt erhalten', () => {
    // geodaten-bis-2027: DATE_RANGE 2026-06-01 bis 2027-12-31 — der Start liegt in der
    // Vergangenheit, der Zeitraum läuft also bereits.
    const runningPolicyId = '00000000-0000-0000-0000-000000000004';

    cy.visitWithMode(`/policies/${runningPolicyId}/edit`, 'few');

    cy.getByCy('daterange-start-input')
      .invoke('val')
      .then((originalStart) => {
        // Der End-Picker öffnet im Dezember 2027 → einen Monat weiter, 1. Januar 2028 wählen.
        cy.getByCy('daterange-end-field').click();
        cy.get('.mat-calendar-next-button').click();
        cy.get('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)').first().click();

        cy.getByCy('daterange-start-input').should('have.value', originalStart);
      });

    cy.getByCy('submit-policy').click();

    cy.location('pathname').should('eq', `/policies/${runningPolicyId}`);
    cy.getByCy('snackbar-success').should('exist');
    cy.getByCy('odrl-panel-header').click();
    cy.getByCy('odrl-json').should('contain', '2026-06-01').and('contain', '2028-01-01');
  });
});
