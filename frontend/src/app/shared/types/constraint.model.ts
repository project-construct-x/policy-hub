export type ConstraintType =
  | 'MEMBERSHIP'
  | 'DATE_RANGE'
  | 'FRAMEWORK_AGREEMENT'
  | 'PARTICIPANT_DID'
  | 'DATA_SUBSET';

export type Operator = 'eq' | 'isAnyOf' | 'gteq' | 'lteq';

export interface MembershipConstraint {
  type: 'MEMBERSHIP';
  value: 'active';
}

export interface DateRangeConstraint {
  type: 'DATE_RANGE';
  startDate: string; // ISO-8601 (YYYY-MM-DD)
  endDate: string; // ISO-8601 (YYYY-MM-DD)
}

export interface FrameworkAgreementConstraint {
  type: 'FRAMEWORK_AGREEMENT';
  agreement: string;
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

export type Constraint =
  | MembershipConstraint
  | DateRangeConstraint
  | FrameworkAgreementConstraint
  | ParticipantDidConstraint
  | DataSubsetConstraint;

/**
 * Constraint-Typen, die keine Voraussetzung an den Konsumenten sind, sondern den Umfang der
 * bereitgestellten Daten festlegen. Sie gelten immer (UND), auch bei ODER-Verknüpfung — sonst
 * ließe sich die Einschränkung durch eine andere erfüllte Voraussetzung umgehen.
 */
const ALWAYS_APPLYING_TYPES: readonly string[] = ['DATA_SUBSET'] satisfies ConstraintType[];

/** Siehe {@link ALWAYS_APPLYING_TYPES}; unbekannte Typen gelten als Voraussetzung. */
export function alwaysApplies(c: Pick<Constraint, 'type'>): boolean {
  return ALWAYS_APPLYING_TYPES.includes(c.type);
}
