/// <reference types="cypress" />

// Constraint zur Teildatensatz-Auswahl: Art aus der Liste wählen, Namen eingeben, Verknüpfung bei
// ODER und Darstellung im Detail.

// geodaten-rahmenvertrag-mitglied ("many"): MEMBERSHIP + FRAMEWORK_AGREEMENT + DIDs + 3 Einträge.
const POLICY_WITH_SUBSET = '00000000-0000-0000-0000-000000000009';

function openNewPolicyWithSubsetConstraint(id: string): void {
  cy.visitWithMode('/policies/new', 'few');
  cy.getByCy('policyId-input').type(id);
  cy.getByCy('category-contract').click();
  cy.getByCy('palette-DATA_SUBSET').click();
  cy.getByCy('constraint-card-DATA_SUBSET').should('exist');
}

function selectKind(kind: 'field' | 'attribute' | 'submodel' | 'record'): void {
  cy.getByCy('data-subset-kind').click();
  cy.getByCy(`data-subset-kind-${kind}`).click();
}

describe('Policy – Teildatensatz', () => {
  it('übernimmt Einträge per Enter und "Hinzufügen" und zeigt sie mit Art im Detail', () => {
    openNewPolicyWithSubsetConstraint('e2e-teildatensatz');

    // Vorauswahl ist "Feld".
    cy.getByCy('data-subset-input').type('materialName{enter}');
    selectKind('submodel');
    cy.getByCy('data-subset-input').type('urn:samm:io.example:1.0.0#Part');
    cy.getByCy('data-subset-add').click();

    // `contain.text`: das Entfernen-Icon im Chip liefert eigenen Text ("cancel").
    cy.getByCy('data-subset-chip').should('have.length', 2);
    cy.getByCy('data-subset-chip')
      .eq(0)
      .should('contain.text', 'Feld:')
      .and('contain.text', 'materialName');
    cy.getByCy('data-subset-chip').eq(1).should('contain.text', 'Submodell:');
    cy.getByCy('data-subset-input').should('have.value', '');

    cy.getByCy('data-subset-remove').first().click();
    cy.getByCy('data-subset-chip').should('have.length', 1);

    cy.getByCy('submit-policy').click();

    cy.getByCy('snackbar-success').should('exist');
    cy.getByCy('cc-selectors')
      .find('li')
      .should('have.length', 1)
      .first()
      .should('contain.text', 'Submodell:')
      .and('contain.text', 'urn:samm:io.example:1.0.0#Part');
  });

  it('übernimmt einen eingetippten Namen auch ohne Enter beim Speichern', () => {
    openNewPolicyWithSubsetConstraint('e2e-teildatensatz-blur');

    cy.getByCy('data-subset-input').type('materialName');
    cy.getByCy('submit-policy').click();

    cy.getByCy('snackbar-success').should('exist');
    cy.getByCy('cc-selectors').find('li').should('have.length', 1);
  });

  it('übernimmt einen Namen mit Leerzeichen nicht und zeigt sofort einen Fehler', () => {
    openNewPolicyWithSubsetConstraint('e2e-teildatensatz-ungueltig');

    cy.getByCy('data-subset-input').type('material name{enter}');

    cy.getByCy('data-subset-chip').should('not.exist');
    cy.getByCy('data-subset-input').should('have.value', 'material name');
    cy.getByCy('data-subset-error').should('be.visible');

    // Weitertippen blendet den Fehler aus.
    cy.getByCy('data-subset-input').clear().type('materialName');
    cy.getByCy('data-subset-error').should('not.exist');
  });

  it('blockiert das Speichern ohne Eintrag und zeigt einen Inline-Fehler', () => {
    openNewPolicyWithSubsetConstraint('e2e-teildatensatz-leer');

    cy.getByCy('submit-policy').click();

    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('data-subset-error').should('be.visible');
  });

  it('bleibt hinter später ergänzten Constraints und ist bei ODER per UND verknüpft', () => {
    openNewPolicyWithSubsetConstraint('e2e-teildatensatz-oder');
    cy.getByCy('palette-MEMBERSHIP').click();
    cy.getByCy('palette-FRAMEWORK_AGREEMENT').click();
    cy.getByCy('logical-operator-OR').click();

    cy.get('[data-cy^="constraint-card-"]')
      .last()
      .should('have.attr', 'data-cy', 'constraint-card-DATA_SUBSET');
    cy.getByCy('logic-connector').should('have.length', 2);
    cy.getByCy('logic-connector').eq(0).should('have.text', 'ODER');
    cy.getByCy('logic-connector').eq(1).should('have.text', 'UND');
    cy.getByCy('data-subset-always-applies').should('be.visible');
  });

  it('befüllt bestehende Einträge beim Bearbeiten vor und speichert Ergänzungen', () => {
    cy.visitWithMode(`/policies/${POLICY_WITH_SUBSET}/edit`, 'many');

    cy.getByCy('data-subset-chip').should('have.length', 3);
    selectKind('attribute');
    cy.getByCy('data-subset-input').type('color{enter}');
    cy.getByCy('data-subset-chip').should('have.length', 4);

    cy.getByCy('submit-policy').click();

    cy.getByCy('snackbar-success').should('exist');
    cy.getByCy('cc-selectors').find('li').should('have.length', 4);
    cy.getByCy('cc-selectors').find('li').last().should('contain.text', 'Merkmal:');
  });
});
