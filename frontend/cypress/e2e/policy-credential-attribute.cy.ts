/// <reference types="cypress" />

// Constraint „Mitgliedschaft & Credentials“ (ABAC): fachliche Merkmale (Partnerart, Arbeitspakete),
// Expertenmodus für beliebige Credentials, Validierung und Darstellung im Detail inkl. ODRL im
// Format der ABAC-Extension des Connectors.

const MEMBERSHIP = 'https://w3id.org/constructx/credentials/v0.1/MembershipCredential';

function openNewPolicyWithCredentialConstraint(id: string): void {
  cy.visitWithMode('/policies/new', 'few');
  cy.getByCy('policyId-input').type(id);
  cy.getByCy('category-access').click();
  cy.getByCy('palette-CREDENTIAL_ATTRIBUTE').click();
  cy.getByCy('constraint-card-CREDENTIAL_ATTRIBUTE').should('exist');
}

function selectProperty(ruleIndex: number, propertyId: string): void {
  cy.getByCy(`credential-rule-property-${ruleIndex}`).click();
  cy.getByCy(`credential-rule-property-option-${propertyId}`).click();
}

describe('Policy – Mitgliedschaft & Credentials (ABAC)', () => {
  it('legt Partnerart und Arbeitspakete fachlich an und zeigt sie verständlich im Detail', () => {
    openNewPolicyWithCredentialConstraint('e2e-mitgliedschaft');

    // Erste Regel: Partnerart ist vorbelegt, nur noch ankreuzen.
    cy.getByCy('credential-rule-option-0-consortium').click();
    cy.getByCy('credential-rule-option-0-associated').click();

    // Zweite Regel: Arbeitspakete (Auswahl 1–9).
    cy.getByCy('credential-rule-add').click();
    selectProperty(1, 'membership.workpackages');
    cy.getByCy('credential-rule-option-1-7').click();
    cy.getByCy('credential-rule-option-1-8').click();

    cy.getByCy('submit-policy').click();

    cy.getByCy('snackbar-success').should('exist');
    cy.getByCy('cc-credential-rules')
      .find('li')
      .should('have.length', 2)
      .then((items) => {
        expect(items.eq(0)).to.contain.text('Partnerart: Konsortialpartner, Assoziierter Partner');
        expect(items.eq(1)).to.contain.text('Arbeitspakete: mind. eines von 7, 8');
      });
    cy.getByCy('legal-text').should(
      'contain',
      'beteiligt an mindestens einem der Arbeitspakete 7, 8',
    );

    cy.getByCy('odrl-panel-header').click();
    cy.getByCy('odrl-json')
      .should('contain', `${MEMBERSHIP}.credentialSubject.workpackages`)
      .and('contain', `${MEMBERSHIP}.credentialSubject.memberType`)
      // Wie in der funktionierenden Referenz-Policy: Zahlenliste als JSON-String.
      .and('contain', '"[7,8]"')
      .and('contain', '[\\"consortium\\",\\"associated\\"]');
  });

  it('blockiert das Speichern ohne ausgewählte Partnerart und fokussiert die Auswahl', () => {
    openNewPolicyWithCredentialConstraint('e2e-mitgliedschaft-leer');

    cy.getByCy('submit-policy').click();

    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('credential-rule-value-error-0').should('be.visible');
    cy.getByCy('credential-rule-options-0').should('have.focus');
  });

  it('bietet Arbeitspakete als Auswahl von 1 bis 9 an und beschriftet die Gruppe', () => {
    openNewPolicyWithCredentialConstraint('e2e-arbeitspakete-auswahl');

    selectProperty(0, 'membership.workpackages');
    cy.getByCy('credential-rule-options-0')
      .should('have.attr', 'role', 'group')
      .and('have.attr', 'aria-labelledby')
      .then((labelId) => {
        cy.get(`[id="${labelId}"]`).should('have.text', ' Arbeitspakete auswählen ');
      });
    cy.getByCy('credential-rule-options-0').find('mat-checkbox').should('have.length', 9);
    cy.getByCy('credential-rule-option-0-9').should('contain.text', 'AP 9');
    cy.getByCy('credential-rule-values-0').should('not.exist');

    // Ohne Auswahl lässt sich nicht speichern.
    cy.getByCy('submit-policy').click();
    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('credential-rule-value-error-0').should('be.visible');
  });

  it('zeigt Merkmal und Vergleich in einer Zeile, der Vergleichstext wird nicht abgeschnitten', () => {
    openNewPolicyWithCredentialConstraint('e2e-zeile');
    selectProperty(0, 'membership.workpackages');

    cy.getByCy('credential-rule-property-0').then(($property) => {
      cy.getByCy('credential-rule-operator-0').then(($operator) => {
        const property = $property[0].getBoundingClientRect();
        const operator = $operator[0].getBoundingClientRect();
        expect(Math.abs(property.top - operator.top)).to.be.lessThan(4);
      });
    });
    cy.getByCy('credential-rule-operator-0')
      .find('.mat-mdc-select-value-text')
      .then(($text) => {
        const element = $text[0] as HTMLElement;
        expect(element.scrollWidth).to.be.at.most(element.clientWidth);
      });
  });

  it('erlaubt im Expertenmodus beliebige Credentials und prüft die Typ-IRI', () => {
    openNewPolicyWithCredentialConstraint('e2e-experte');

    selectProperty(0, 'expert');
    cy.getByCy('credential-rule-type-0').type('SiteAccessCredential');
    cy.getByCy('credential-rule-attribute-0').type('accessLevel');
    cy.getByCy('credential-rule-operator-0').click();
    cy.getByCy('credential-rule-operator-option-gteq').click();
    cy.getByCy('credential-rule-value-0').type('4');

    // Ohne vollständige IRI blockiert das Speichern.
    cy.getByCy('submit-policy').click();
    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('credential-rule-type-error-0').should('be.visible');
    cy.getByCy('credential-rule-type-0').should('have.focus');

    cy.getByCy('credential-rule-type-0')
      .clear()
      .type('https://example.com/credentials/SiteAccessCredential');
    cy.getByCy('submit-policy').click();

    cy.getByCy('snackbar-success').should('exist');
    cy.getByCy('cc-credential-rules')
      .find('li')
      .should('contain.text', 'SiteAccessCredential · accessLevel ≥ 4');
    cy.getByCy('odrl-panel-header').click();
    cy.getByCy('odrl-json').should(
      'contain',
      'https://example.com/credentials/SiteAccessCredential.credentialSubject.accessLevel',
    );
  });

  it('blendet den Papierkorb erst ab der zweiten Regel ein, die letzte Regel bleibt erhalten', () => {
    openNewPolicyWithCredentialConstraint('e2e-mitgliedschaft-entfernen');

    cy.getByCy('credential-rule-remove-0').should('not.exist');
    cy.getByCy('credential-rule-add').click();
    cy.getByCy('credential-rule-property-1').should('have.focus');
    cy.getByCy('credential-rule-remove-0').should('be.visible');
    cy.getByCy('credential-rule-remove-1').should('be.visible');
    cy.get('[data-cy^="credential-rule-property-"]')
      .filter(':not([data-cy*="option"])')
      .should('have.length', 2);

    cy.getByCy('credential-rule-remove-1').click();
    cy.get('[data-cy^="credential-rule-property-"]')
      .filter(':not([data-cy*="option"])')
      .should('have.length', 1);
    cy.getByCy('credential-rule-remove-0').should('not.exist');
    cy.getByCy('credential-rule-add').should('have.focus');
  });
});
