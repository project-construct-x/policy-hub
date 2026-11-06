/// <reference types="cypress" />

// Die auf der Detailseite angezeigte Erläuterung der Constraints wird jedes Mal neu aus den
// Constraints abgeleitet; angezeigt wird aber der beim Speichern übermittelte und persistierte
// Text. Weichen beide voneinander ab, warnt die Seite (siehe `hasDivergingLegalText`).
//
// Hier wird der Gutfall abgesichert: eine über die UI gespeicherte Policy darf NIE eine
// Warnung zeigen. Das ist der Regressionsschutz für die Ableitungslogik — ändert sie sich,
// ohne dass `legalText` neu erzeugt wird, schlägt dieser Test an.
//
// Der Schlechtfall (manipulierter legalText bei unveränderten Constraints) lässt sich hier
// nicht ehrlich nachstellen: MirageJS ersetzt XMLHttpRequest im Browser vollständig, und
// cy.intercept sieht die Requests deshalb nie. Er ist stattdessen als Unit-Test auf
// `hasDivergingLegalText` in legal-description.helper.spec.ts abgedeckt.

// zugriff-konsortium-mitglieder: ACCESS mit einer MEMBERSHIP-Bedingung.
const POLICY_ID = '00000000-0000-0000-0000-000000000002';

describe('Policy – Erläuterung der Constraints', () => {
  it('zeigt nach dem Speichern über die UI keine Abweichungs-Warnung', () => {
    cy.visitWithMode(`/policies/${POLICY_ID}/edit`, 'few');
    cy.getByCy('submit-policy').click();

    // Detailseite ist erreicht und die Erläuterung der Constraints gerendert …
    cy.getByCy('policy-title').should('exist');
    cy.getByCy('legal-text').should('exist');
    // … ohne dass gespeicherter und abgeleiteter Text auseinanderlaufen.
    cy.getByCy('legal-text-diverged').should('not.exist');
  });

  it('zeigt für eine Policy ohne gespeicherte Erläuterung keine Warnung', () => {
    // Die Seed-Datensätze tragen keinen legalText — ohne gespeicherten Text gibt es
    // nichts zu vergleichen, und es darf kein Fehlalarm entstehen.
    cy.visitWithMode(`/policies/${POLICY_ID}`, 'few');

    cy.getByCy('legal-text').should('exist');
    cy.getByCy('legal-text-diverged').should('not.exist');
  });
});
