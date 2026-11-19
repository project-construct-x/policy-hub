export type ConstraintType =
  | 'DATE_RANGE'
  | 'PARTICIPANT_DID'
  | 'DATA_SUBSET'
  | 'CREDENTIAL_ATTRIBUTE';

export type Operator = 'eq' | 'isAnyOf' | 'gteq' | 'lteq';

export interface DateRangeConstraint {
  type: 'DATE_RANGE';
  startDate: string; // ISO-8601 (YYYY-MM-DD)
  endDate: string; // ISO-8601 (YYYY-MM-DD)
}

/** Nur die aufgeführten Teilnehmer (did:web-Identitäten) erfüllen die Policy. */
export interface ParticipantDidConstraint {
  type: 'PARTICIPANT_DID';
  dids: string[];
}

/**
 * Nur die aufgeführten Teile eines Datensatzes (Felder, Merkmale, Submodelle, Records) werden dem
 * Konsumenten bereitgestellt. Die Policy liefert nur die Filterkriterien; gefiltert wird im
 * ausliefernden Dienst. Selektor-Format: `<art>:<bezeichner>`, z.B. `field:materialName`.
 */
export interface DataSubsetConstraint {
  type: 'DATA_SUBSET';
  selectors: string[];
}

/** Operatoren, die eine Credential-Regel anbieten (Auswahl aus der ABAC-Extension des Connectors). */
export const CREDENTIAL_RULE_OPERATORS = [
  'eq',
  'neq',
  'gt',
  'gteq',
  'lt',
  'lteq',
  'isAnyOf',
  'isNoneOf',
] as const;
export type CredentialRuleOperator = (typeof CREDENTIAL_RULE_OPERATORS)[number];

/**
 * Art des Vergleichswerts je Operator: `text` und `number` nutzen `value`, `list` nutzt `values`.
 */
export type CredentialValueKind = 'text' | 'number' | 'list';

export function credentialValueKind(operator: CredentialRuleOperator): CredentialValueKind {
  switch (operator) {
    case 'eq':
    case 'neq':
      return 'text';
    case 'gt':
    case 'gteq':
    case 'lt':
    case 'lteq':
      return 'number';
    case 'isAnyOf':
    case 'isNoneOf':
      return 'list';
  }
}

/** Zahl im Format der Vergleichswerte, z.B. `4` oder `-2.5`. */
const NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/;

/**
 * Werteliste als JSON-String für den ODRL-RightOperand der ABAC-Extension. Besteht die Liste nur
 * aus Zahlen, werden sie als Zahlen geschrieben (`[7,8]`), sonst als Strings (`["a","b"]`).
 */
export function credentialValuesToJson(values: readonly string[]): string {
  return values.every((value) => NUMBER_PATTERN.test(value))
    ? JSON.stringify(values.map(Number))
    : JSON.stringify(values);
}

/**
 * Eine Prüfung auf ein Attribut im `credentialSubject` eines Verifiable Credentials des
 * Konsumenten. `value` und `values` sind immer vorhanden; welches gilt, bestimmt
 * {@link credentialValueKind} — das andere bleibt beim Wechsel des Operators erhalten.
 */
export interface CredentialRule {
  /** Vollständige Typ-IRI, z.B. `https://w3id.org/constructx/credentials/v0.1/MembershipCredential`. */
  credentialType: string;
  /** Pfad im `credentialSubject`, z.B. `isMember`, `roles[0]` oder `site.accessLevel`. */
  attributePath: string;
  operator: CredentialRuleOperator;
  value: string;
  values: string[];
}

/**
 * Nur Konsumenten, deren Verifiable Credentials alle Regeln erfüllen (attributbasierte
 * Zugriffskontrolle, ABAC). Die Regeln sind untereinander per UND verknüpft.
 */
export interface CredentialAttributeConstraint {
  type: 'CREDENTIAL_ATTRIBUTE';
  rules: CredentialRule[];
}

export type Constraint =
  | DateRangeConstraint
  | ParticipantDidConstraint
  | DataSubsetConstraint
  | CredentialAttributeConstraint;

/**
 * Constraint-Typen, die keine Voraussetzung an den Konsumenten sind, sondern den Umfang der
 * bereitgestellten Daten festlegen. Sie gelten immer (UND), auch bei ODER-Verknüpfung — sonst
 * ließe sich die Einschränkung durch eine andere erfüllte Voraussetzung umgehen.
 */
const ALWAYS_APPLYING_TYPES: readonly string[] = ['DATA_SUBSET'] satisfies ConstraintType[];

/** Siehe {@link ALWAYS_APPLYING_TYPES}; unbekannte Typen gelten als Voraussetzung. */
export function alwaysApplies(constraint: Pick<Constraint, 'type'>): boolean {
  return ALWAYS_APPLYING_TYPES.includes(constraint.type);
}
