/// <reference types="cypress" />

// Constraint zur Teilnehmer-Auswahl (did:web): Chip-Eingabe im Builder und Darstellung im Detail.

// geodaten-rahmenvertrag-mitglied ("many"): MEMBERSHIP + FRAMEWORK_AGREEMENT + 2 DIDs
// (+ DATA_SUBSET, siehe policy-data-subset.cy.ts).
const POLICY_WITH_DIDS = '00000000-0000-0000-0000-000000000009';

/**
 * Löst ein echtes `ClipboardEvent` mit `DataTransfer` im Fenster der App aus. Ein per
 * `trigger('paste', { clipboardData })` erzeugtes Event wäre nur ein generisches `Event` mit
 * angehängtem Fake-Objekt und würde das Browser-Verhalten nicht abbilden.
 */
function paste(selector: string, text: string): void {
  cy.window().then((win) => {
    cy.getByCy(selector).then(($input) => {
      const clipboardData = new win.DataTransfer();
      clipboardData.setData('text/plain', text);
      const event = new win.ClipboardEvent('paste', {
        clipboardData,
        bubbles: true,
        cancelable: true,
      });
      $input[0].dispatchEvent(event);
    });
  });
}

function openNewPolicyWithDidConstraint(id: string): void {
  cy.visitWithMode('/policies/new', 'few');
  cy.getByCy('policyId-input').type(id);
  cy.getByCy('category-access').click();
  cy.getByCy('palette-PARTICIPANT_DID').click();
  cy.getByCy('constraint-card-PARTICIPANT_DID').should('exist');
}

describe('Policy – Teilnehmer-Auswahl (did:web)', () => {
  it('übernimmt DIDs per Enter und Komma, entfernt Chips und zeigt sie im Detail', () => {
    openNewPolicyWithDidConstraint('e2e-teilnehmer');

    cy.getByCy('participant-did-input').type('did:web:a.example{enter}');
    cy.getByCy('participant-did-input').type('did:web:b.example,');
    cy.getByCy('participant-did-input').type('did:web:c.example%3A8443:edc{enter}');
    cy.getByCy('participant-did-chip').should('have.length', 3);
    cy.getByCy('participant-did-input').should('have.value', '');

    cy.getByCy('participant-did-remove').first().click();
    cy.getByCy('participant-did-chip').should('have.length', 2);

    cy.getByCy('submit-policy').click();

    cy.getByCy('snackbar-success').should('exist');
    cy.getByCy('cc-dids')
      .find('li')
      .should('have.length', 2)
      .first()
      .should('have.text', 'did:web:b.example');
  });

  it('übernimmt eine ungültige DID nicht und zeigt sofort einen Fehler', () => {
    openNewPolicyWithDidConstraint('e2e-teilnehmer-ungueltig');

    cy.getByCy('participant-did-input').type('example.com{enter}');

    cy.getByCy('participant-did-chip').should('not.exist');
    cy.getByCy('participant-did-input').should('have.value', 'example.com');
    cy.getByCy('participant-did-error').should('be.visible');

    // Weitertippen blendet den Fehler aus.
    cy.getByCy('participant-did-input').clear().type('did:web:');
    cy.getByCy('participant-did-error').should('not.exist');
  });

  it('lehnt Duplikate ab, auch bei abweichender Groß-/Kleinschreibung', () => {
    openNewPolicyWithDidConstraint('e2e-teilnehmer-duplikat');

    cy.getByCy('participant-did-input').type('did:web:a.example{enter}');
    cy.getByCy('participant-did-input').type('did:web:A.Example{enter}');

    cy.getByCy('participant-did-chip').should('have.length', 1);
    cy.getByCy('participant-did-input').should('have.value', 'did:web:A.Example');
    cy.getByCy('participant-did-error').should('be.visible');
  });

  it('teilt mehrere eingefügte DIDs auf', () => {
    openNewPolicyWithDidConstraint('e2e-teilnehmer-einfuegen');

    paste('participant-did-input', 'did:web:a.example, did:web:b.example\nkaputt');

    // `contain.text`: das Entfernen-Icon im Chip liefert eigenen Text ("cancel").
    cy.getByCy('participant-did-chip').should('have.length', 2);
    cy.getByCy('participant-did-chip').eq(0).should('contain.text', 'did:web:a.example');
    cy.getByCy('participant-did-chip').eq(1).should('contain.text', 'did:web:b.example');
    // Default-Paste unterdrückt: nur der abgelehnte Rest steht im Feld, nicht der ganze Text.
    cy.getByCy('participant-did-input').should('have.value', 'kaputt');
    cy.getByCy('participant-did-error').should('be.visible');
  });

  it('blockiert das Speichern, solange eine ungültige DID im Feld steht', () => {
    openNewPolicyWithDidConstraint('e2e-teilnehmer-offener-text');

    cy.getByCy('participant-did-input').type('did:web:a.example{enter}');
    cy.getByCy('participant-did-input').type('kaputt');

    // Der Klick verlässt das Feld (Blur → Prüfung) und darf danach nicht speichern.
    cy.getByCy('submit-policy').click();

    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('participant-did-error').should('be.visible');
    cy.getByCy('participant-did-input').should('have.value', 'kaputt').and('be.focused');

    // Nach Korrektur ist Speichern wieder möglich.
    cy.getByCy('participant-did-input').clear().type('did:web:b.example{enter}');
    cy.getByCy('submit-policy').click();
    cy.getByCy('snackbar-success').should('exist');
    cy.getByCy('cc-dids').find('li').should('have.length', 2);
  });

  it('blockiert das Speichern ohne Teilnehmer und zeigt einen Inline-Fehler', () => {
    openNewPolicyWithDidConstraint('e2e-teilnehmer-leer');

    cy.getByCy('submit-policy').click();

    cy.location('pathname').should('eq', '/policies/new');
    cy.getByCy('participant-did-error').should('be.visible');
  });

  it('befüllt bestehende DIDs beim Bearbeiten vor und speichert Ergänzungen', () => {
    cy.visitWithMode(`/policies/${POLICY_WITH_DIDS}/edit`, 'many');

    cy.getByCy('participant-did-chip').should('have.length', 2);
    cy.getByCy('participant-did-input').type('did:web:neu.example{enter}');
    cy.getByCy('participant-did-chip').should('have.length', 3);

    cy.getByCy('submit-policy').click();

    cy.getByCy('snackbar-success').should('exist');
    cy.getByCy('cc-dids').find('li').should('have.length', 3);
  });
});
