import { CredentialRule, CredentialRuleOperator } from '@shared/types/constraint.model';

/**
 * Typ-IRI des Construct-X-MembershipCredentials (aus einer in der Testumgebung funktionierenden
 * Policy). Steht nur hier; ändert sich das Credential, genügt eine Anpassung an dieser Stelle.
 */
export const MEMBERSHIP_CREDENTIAL_TYPE =
  'https://w3id.org/constructx/credentials/v0.1/MembershipCredential';

/**
 * Werteart eines bekannten Merkmals. Beide Arten sind eine feste Auswahl (Checkboxen); sie
 * unterscheiden sich nur in der Anzeige: `enum` zeigt den Namen der Option, `number` die Zahl.
 */
export type KnownPropertyKind = 'enum' | 'number';

export interface KnownPropertyOption {
  value: string;
  labelKey: string;
  /** Parameter für `labelKey`, z.B. die Nummer eines Arbeitspakets. */
  labelParams?: Record<string, string | number>;
}

export interface KnownPropertyOperator {
  operator: CredentialRuleOperator;
  /** Fachlicher Name des Vergleichs im Editor, z.B. „beteiligt an mindestens einem von“. */
  labelKey: string;
  /** Kurzfassung für die Chips der Detailseite; Parameter `values`. */
  summaryKey: string;
  /** Satzteil für die Erläuterung der Constraints; Parameter `values`. */
  legalKey: string;
}

/**
 * Ein Merkmal eines bekannten Credentials, fachlich beschrieben. Regeln auf diese Merkmale zeigt
 * der Editor ohne technische Angaben an; alles andere bleibt dem Expertenmodus vorbehalten.
 */
export interface KnownCredentialProperty {
  /** Eindeutiger Schlüssel für die Auswahlliste, z.B. `membership.memberType`. */
  id: string;
  credentialType: string;
  attributePath: string;
  labelKey: string;
  /** Beschriftung der Checkbox-Gruppe, z.B. „Partnerart auswählen“. */
  selectLabelKey: string;
  kind: KnownPropertyKind;
  /** Erlaubte Werte; nur diese lassen sich auswählen und speichern. */
  options: readonly KnownPropertyOption[];
  /** Angebotene Vergleiche; der erste ist die Vorbelegung. */
  operators: readonly KnownPropertyOperator[];
}

/** Arbeitspakete des Projekts. */
const WORKPACKAGE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface KnownCredential {
  credentialType: string;
  labelKey: string;
  properties: readonly KnownCredentialProperty[];
}

/**
 * Bekannte Credentials und ihre Merkmale, beschrieben wie ein Schema. Sobald Credential-Schemas
 * abrufbar sind, kann diese Liste daraus erzeugt werden; der Editor bleibt unverändert.
 * i18n-Keys bewusst ausgeschrieben (i18n-Regel: keine dynamischen Keys).
 */
export const KNOWN_CREDENTIALS: readonly KnownCredential[] = [
  {
    credentialType: MEMBERSHIP_CREDENTIAL_TYPE,
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.label',
    properties: [
      {
        id: 'membership.memberType',
        credentialType: MEMBERSHIP_CREDENTIAL_TYPE,
        attributePath: 'memberType',
        labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.memberType.label',
        selectLabelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.memberType.selectLabel',
        kind: 'enum',
        options: [
          {
            value: 'consortium',
            labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.memberType.option.consortium',
          },
          {
            value: 'associated',
            labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.memberType.option.associated',
          },
          {
            value: 'external',
            labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.memberType.option.external',
          },
        ],
        operators: [
          {
            operator: 'isAnyOf',
            labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.memberType.operator.isAnyOf',
            summaryKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.memberType.summary.isAnyOf',
            legalKey: 'legalDescription.membership.memberType.isAnyOf',
          },
          {
            operator: 'isNoneOf',
            labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.memberType.operator.isNoneOf',
            summaryKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.memberType.summary.isNoneOf',
            legalKey: 'legalDescription.membership.memberType.isNoneOf',
          },
        ],
      },
      {
        id: 'membership.workpackages',
        credentialType: MEMBERSHIP_CREDENTIAL_TYPE,
        attributePath: 'workpackages',
        labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.workpackages.label',
        selectLabelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.workpackages.selectLabel',
        kind: 'number',
        options: WORKPACKAGE_NUMBERS.map((number) => ({
          value: String(number),
          labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.workpackages.option',
          labelParams: { number },
        })),
        operators: [
          {
            operator: 'isAnyOf',
            labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.workpackages.operator.isAnyOf',
            summaryKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.workpackages.summary.isAnyOf',
            legalKey: 'legalDescription.membership.workpackages.isAnyOf',
          },
          {
            operator: 'isNoneOf',
            labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.workpackages.operator.isNoneOf',
            summaryKey: 'constraint.CREDENTIAL_ATTRIBUTE.membership.workpackages.summary.isNoneOf',
            legalKey: 'legalDescription.membership.workpackages.isNoneOf',
          },
        ],
      },
    ],
  },
];

export const KNOWN_CREDENTIAL_PROPERTIES: readonly KnownCredentialProperty[] =
  KNOWN_CREDENTIALS.flatMap((credential) => credential.properties);

export function knownPropertyById(id: string): KnownCredentialProperty | null {
  return KNOWN_CREDENTIAL_PROPERTIES.find((property) => property.id === id) ?? null;
}

export function knownCredentialFor(property: KnownCredentialProperty): KnownCredential | null {
  return (
    KNOWN_CREDENTIALS.find((credential) => credential.credentialType === property.credentialType) ??
    null
  );
}

/**
 * Das bekannte Merkmal, auf das sich eine Regel bezieht — nur wenn Credential, Attribut **und**
 * Vergleich zum Merkmal passen. Sonst `null`: Die Regel wird im Expertenmodus angezeigt.
 * Die Regel kann aus einem HTTP-Response stammen, daher wird nichts vorausgesetzt.
 */
export function knownPropertyOf(rule: unknown): KnownCredentialProperty | null {
  if (typeof rule !== 'object' || rule === null) return null;
  const { credentialType, attributePath, operator } = rule as Record<string, unknown>;
  return (
    KNOWN_CREDENTIAL_PROPERTIES.find(
      (property) =>
        property.credentialType === credentialType &&
        property.attributePath === attributePath &&
        property.operators.some((option) => option.operator === operator),
    ) ?? null
  );
}

export function knownPropertyOperator(
  property: KnownCredentialProperty,
  operator: unknown,
): KnownPropertyOperator | null {
  return property.operators.find((option) => option.operator === operator) ?? null;
}

export function knownPropertyOption(
  property: KnownCredentialProperty,
  value: unknown,
): KnownPropertyOption | null {
  return property.options.find((option) => option.value === value) ?? null;
}

/** Anzeigewert eines bekannten Merkmals: i18n-Key einer Auswahl oder der Wert selbst (Zahl). */
export type KnownPropertyDisplayValue = { labelKey: string } | { text: string };

/**
 * Anzeigewerte einer Regel auf ein bekanntes Merkmal; `null`, wenn ein Wert nicht erlaubt ist.
 * Auswahlwerte werden über die Registry übersetzt, Zahlen nur nach Prüfung übernommen — so ist
 * jeder Wert als Transloco-Parameter unbedenklich.
 */
export function knownPropertyDisplayValues(
  property: KnownCredentialProperty,
  values: unknown,
): KnownPropertyDisplayValue[] | null {
  if (!Array.isArray(values) || !values.length) return null;
  const result: KnownPropertyDisplayValue[] = [];
  for (const value of values) {
    const option = knownPropertyOption(property, value);
    if (!option) return null;
    result.push(property.kind === 'enum' ? { labelKey: option.labelKey } : { text: option.value });
  }
  return result;
}

/** Neue Regel für ein bekanntes Merkmal: erster Vergleich, noch ohne Werte. */
export function buildKnownPropertyRule(property: KnownCredentialProperty): CredentialRule {
  return {
    credentialType: property.credentialType,
    attributePath: property.attributePath,
    operator: property.operators[0].operator,
    value: '',
    values: [],
  };
}

/** Neue Regel im Expertenmodus: alle Angaben leer, nur der Vergleich ist vorbelegt. */
export function buildExpertRule(): CredentialRule {
  return { credentialType: '', attributePath: '', operator: 'eq', value: '', values: [] };
}

export interface CredentialOperatorOption {
  operator: CredentialRuleOperator;
  /** Anzeigename im Editor (Auswahlliste), z.B. „größer oder gleich“. */
  labelKey: string;
  /** Kurzform für die Zusammenfassung auf der Detailseite, z.B. `≥`. */
  symbolKey: string;
}

/**
 * Auswahlliste der Operatoren. i18n-Keys bewusst ausgeschrieben statt aus dem Operator
 * zusammengesetzt (i18n-Regel: keine dynamischen Keys).
 */
export const CREDENTIAL_OPERATOR_OPTIONS: readonly CredentialOperatorOption[] = [
  {
    operator: 'eq',
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.operator.eq',
    symbolKey: 'constraint.CREDENTIAL_ATTRIBUTE.symbol.eq',
  },
  {
    operator: 'neq',
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.operator.neq',
    symbolKey: 'constraint.CREDENTIAL_ATTRIBUTE.symbol.neq',
  },
  {
    operator: 'gt',
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.operator.gt',
    symbolKey: 'constraint.CREDENTIAL_ATTRIBUTE.symbol.gt',
  },
  {
    operator: 'gteq',
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.operator.gteq',
    symbolKey: 'constraint.CREDENTIAL_ATTRIBUTE.symbol.gteq',
  },
  {
    operator: 'lt',
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.operator.lt',
    symbolKey: 'constraint.CREDENTIAL_ATTRIBUTE.symbol.lt',
  },
  {
    operator: 'lteq',
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.operator.lteq',
    symbolKey: 'constraint.CREDENTIAL_ATTRIBUTE.symbol.lteq',
  },
  {
    operator: 'isAnyOf',
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.operator.isAnyOf',
    symbolKey: 'constraint.CREDENTIAL_ATTRIBUTE.symbol.isAnyOf',
  },
  {
    operator: 'isNoneOf',
    labelKey: 'constraint.CREDENTIAL_ATTRIBUTE.operator.isNoneOf',
    symbolKey: 'constraint.CREDENTIAL_ATTRIBUTE.symbol.isNoneOf',
  },
];

/** Registry-Eintrag zum Operator; `null` bei unbekanntem Wert (z.B. aus einem HTTP-Response). */
export function credentialOperatorOption(operator: unknown): CredentialOperatorOption | null {
  return CREDENTIAL_OPERATOR_OPTIONS.find((option) => option.operator === operator) ?? null;
}
