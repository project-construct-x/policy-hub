import {
  alwaysApplies,
  Constraint,
  ConstraintType,
  CredentialRule,
  Operator,
} from '@shared/types/constraint.model';
import {
  buildKnownPropertyRule,
  KNOWN_CREDENTIAL_PROPERTIES,
} from '@features/policies/builder/metadata/credential-attribute.data';
import { LogicalOperator, PolicyCategory } from '@shared/types/policy.model';

export interface ConstraintMetadata {
  type: ConstraintType;
  labelKey: string;
  descriptionKey: string;
  legalTextKey: string;
  icon: string;
  defaultOperator: Operator;
  allowedIn: PolicyCategory[];
}

export const CONSTRAINT_METADATA: Record<ConstraintType, ConstraintMetadata> = {
  DATE_RANGE: {
    type: 'DATE_RANGE',
    labelKey: 'constraint.DATE_RANGE.label',
    descriptionKey: 'constraint.DATE_RANGE.description',
    legalTextKey: 'constraint.DATE_RANGE.legalText',
    icon: 'date_range',
    defaultOperator: 'lteq',
    allowedIn: ['ACCESS', 'CONTRACT'],
  },
  PARTICIPANT_DID: {
    type: 'PARTICIPANT_DID',
    labelKey: 'constraint.PARTICIPANT_DID.label',
    descriptionKey: 'constraint.PARTICIPANT_DID.description',
    legalTextKey: 'constraint.PARTICIPANT_DID.legalText',
    icon: 'badge',
    defaultOperator: 'eq',
    allowedIn: ['ACCESS', 'CONTRACT'],
  },
  DATA_SUBSET: {
    type: 'DATA_SUBSET',
    labelKey: 'constraint.DATA_SUBSET.label',
    descriptionKey: 'constraint.DATA_SUBSET.description',
    legalTextKey: 'constraint.DATA_SUBSET.legalText',
    icon: 'filter_alt',
    defaultOperator: 'isAnyOf',
    allowedIn: ['ACCESS', 'CONTRACT'],
  },
  CREDENTIAL_ATTRIBUTE: {
    type: 'CREDENTIAL_ATTRIBUTE',
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.label',
    descriptionKey: 'constraint.CREDENTIAL_ATTRIBUTE.description',
    legalTextKey: 'constraint.CREDENTIAL_ATTRIBUTE.legalText',
    icon: 'verified_user',
    defaultOperator: 'eq',
    allowedIn: ['ACCESS', 'CONTRACT'],
  },
};

export const ALL_CONSTRAINT_TYPES: ConstraintType[] = [
  'DATE_RANGE',
  'PARTICIPANT_DID',
  'DATA_SUBSET',
  'CREDENTIAL_ATTRIBUTE',
];

export function getAllowedConstraintTypes(category: PolicyCategory): ConstraintType[] {
  return ALL_CONSTRAINT_TYPES.filter((t) => CONSTRAINT_METADATA[t].allowedIn.includes(category));
}

/**
 * Laufzeit-Prüfung, ob die Registry einen Constraint-Typ kennt.
 *
 * `Record<ConstraintType, ConstraintMetadata>` verspricht nur zur Compile-Zeit, dass ein
 * Index-Zugriff Metadaten liefert. Constraints aus `GET /v1/policies/:id` sind ungeprüfte
 * Eingabe: bei einem unbekannten Typ ist `CONSTRAINT_METADATA[type]` zur Laufzeit `undefined`,
 * und der folgende Property-Zugriff (`.icon`, `.labelKey`, `.allowedIn`) wirft einen TypeError
 * mitten im Rendering — die Seite bleibt für jeden Nutzer defekt.
 */
export function isKnownConstraintType(type: string): type is ConstraintType {
  return Object.prototype.hasOwnProperty.call(CONSTRAINT_METADATA, type);
}

/** Entfernt alle Constraints, deren Typ die Registry nicht kennt. */
export function keepKnownConstraints(constraints: readonly Constraint[]): Constraint[] {
  return constraints.filter((c) => isKnownConstraintType(c.type));
}

export function buildDefaultConstraint(type: ConstraintType): Constraint {
  switch (type) {
    case 'DATE_RANGE':
      return { type: 'DATE_RANGE', startDate: '', endDate: '' };
    case 'PARTICIPANT_DID':
      return { type: 'PARTICIPANT_DID', dids: [] };
    case 'DATA_SUBSET':
      return { type: 'DATA_SUBSET', selectors: [] };
    case 'CREDENTIAL_ATTRIBUTE':
      return { type: 'CREDENTIAL_ATTRIBUTE', rules: [buildDefaultCredentialRule()] };
  }
}

/**
 * Neue Regel: das erste bekannte Merkmal (Partnerart der Mitgliedschaft), noch ohne Auswahl
 * (per Validator ungültig, bis der Nutzer Werte wählt).
 */
export function buildDefaultCredentialRule(): CredentialRule {
  return buildKnownPropertyRule(KNOWN_CREDENTIAL_PROPERTIES[0]);
}

/**
 * Stellt Constraints, die immer gelten, ans Ende (stabil, sonst unveränderte Reihenfolge). So
 * stehen sie in Editor, Detailansicht, Erläuterung und ODRL einheitlich hinter den
 * Voraussetzungen, die per UND/ODER verknüpft werden.
 */
export function orderConstraints<T extends Pick<Constraint, 'type'>>(
  constraints: readonly T[],
): T[] {
  return [
    ...constraints.filter((constraint) => !alwaysApplies(constraint)),
    ...constraints.filter((constraint) => alwaysApplies(constraint)),
  ];
}

/**
 * i18n-Key des Verknüpfungslabels zwischen `constraints[index]` und dem folgenden Constraint.
 * Grenzt einer der beiden an einen immer geltenden Constraint, ist es unabhängig vom gewählten
 * Operator UND.
 */
export function connectorKeyAfter(
  constraints: readonly Pick<Constraint, 'type'>[],
  index: number,
  logicalOperator: LogicalOperator,
): string {
  const next = constraints[index + 1];
  const forcedAnd =
    alwaysApplies(constraints[index]) || (next !== undefined && alwaysApplies(next));
  return logicalOperator === 'OR' && !forcedAnd
    ? 'policyBuilder.orConnector'
    : 'policyBuilder.andConnector';
}
