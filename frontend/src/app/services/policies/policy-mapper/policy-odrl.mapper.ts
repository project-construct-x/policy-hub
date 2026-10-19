import { Constraint } from '@shared/types/constraint.model';
import { logicalOperatorOf, Policy, PolicyCategory } from '@shared/types/policy.model';

const CX_POLICY_NS = 'https://w3id.org/catenax/2025/9/policy/';
const ODRL_USE = 'odrl:use';
const CX_ACCESS = `${CX_POLICY_NS}access`;
/** Teilnehmer-Identität im EDC-Namespace; Format wie in der HTX Connector Management UI. */
const EDC_CONNECTOR = 'edc:connector';

const ODRL_CONTEXT = {
  '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
  edc: 'https://w3id.org/edc/v0.0.1/ns/',
  odrl: 'http://www.w3.org/ns/odrl/2/',
};

export interface OdrlAtomicConstraint {
  'odrl:leftOperand': { '@id': string };
  'odrl:operator': { '@id': string };
  'odrl:rightOperand': string | string[];
}

export interface OdrlAndConstraint {
  'odrl:and': OdrlConstraintNode[];
}

export interface OdrlOrConstraint {
  'odrl:or': OdrlConstraintNode[];
}

export type OdrlConstraintGroup = OdrlAndConstraint | OdrlOrConstraint;

/** Element einer logischen Gruppe: ein atomarer Constraint oder eine verschachtelte Gruppe. */
export type OdrlConstraintNode = OdrlAtomicConstraint | OdrlConstraintGroup;

interface OdrlPermission {
  'odrl:action': { '@id': string };
  'odrl:constraint'?: OdrlConstraintGroup;
}

/**
 * EDC-PolicyDefinition-Envelope (Management-API `/v3/policydefinitions`).
 * Access- und Contract-Policy teilen dasselbe Envelope; sie unterscheiden sich per
 * Catena-X-Konvention nur über die `odrl:action` (Access = `access`, Contract = `odrl:use`).
 * Die endgültige Rolle wird technisch erst in der ContractDefinition festgelegt.
 */
export interface OdrlPolicyDefinition {
  '@context': typeof ODRL_CONTEXT;
  '@type': 'PolicyDefinition';
  '@id': string;
  policy: {
    '@context': 'http://www.w3.org/ns/odrl.jsonld';
    '@type': 'Set';
    'odrl:permission': OdrlPermission[];
    'odrl:prohibition': [];
    'odrl:obligation': [];
  };
}

/** Catena-X-Konvention: Access Policy -> `access`, Contract/Usage Policy -> `odrl:use`. */
export function actionForCategory(category: PolicyCategory): string {
  return category === 'ACCESS' ? CX_ACCESS : ODRL_USE;
}

/**
 * Übersetzt einen fachlichen Constraint in ein oder mehrere atomare ODRL-Constraints.
 * Die meisten Typen liefern genau eines; ein `DATE_RANGE` liefert zwei (Start via `gteq`,
 * Ende via `lteq`), die in `odrlConstraintGroup` gruppiert werden.
 */
export function constraintToOdrl(c: Constraint): OdrlAtomicConstraint[] {
  switch (c.type) {
    case 'MEMBERSHIP':
      return [
        {
          'odrl:leftOperand': { '@id': `${CX_POLICY_NS}Membership` },
          'odrl:operator': { '@id': 'odrl:eq' },
          'odrl:rightOperand': c.value,
        },
      ];
    case 'DATE_RANGE':
      return [
        {
          'odrl:leftOperand': { '@id': `${CX_POLICY_NS}DataUsageStartDate` },
          'odrl:operator': { '@id': 'odrl:gteq' },
          'odrl:rightOperand': c.startDate,
        },
        {
          'odrl:leftOperand': { '@id': `${CX_POLICY_NS}DataUsageEndDate` },
          'odrl:operator': { '@id': 'odrl:lteq' },
          'odrl:rightOperand': c.endDate,
        },
      ];
    case 'FRAMEWORK_AGREEMENT':
      return [
        {
          'odrl:leftOperand': { '@id': `${CX_POLICY_NS}FrameworkAgreement` },
          'odrl:operator': { '@id': 'odrl:eq' },
          'odrl:rightOperand': c.agreement,
        },
      ];
    case 'PARTICIPANT_DID':
      // Komma-getrennter String statt Array: so erwartet es der Connector (die HTX Connector UI
      // schreibt und liest `edc:connector` genauso). did:web-Werte enthalten keine Kommas.
      return [
        {
          'odrl:leftOperand': { '@id': EDC_CONNECTOR },
          'odrl:operator': { '@id': 'odrl:eq' },
          'odrl:rightOperand': c.dids.join(','),
        },
      ];
  }
}

/**
 * Bildet die Constraints einer Policy auf die logische Gruppe unter `odrl:constraint` ab.
 *
 * - `AND`: alle atomaren Constraints flach in `odrl:and` (identisch zur bisherigen Ausgabe).
 * - `OR`: je fachlichem Constraint ein Element in `odrl:or`. Liefert ein Constraint mehrere
 *   atomare Constraints (`DATE_RANGE`: Start UND Ende), werden sie in ein inneres `odrl:and`
 *   gewickelt — flach im `odrl:or` hieße es sonst "Startdatum ODER Enddatum".
 *
 * Ohne Constraints gibt es keine Gruppe (`undefined`).
 */
export function odrlConstraintGroup(
  policy: Pick<Policy, 'constraints' | 'logicalOperator'>,
): OdrlConstraintGroup | undefined {
  if (policy.constraints.length === 0) return undefined;

  if (logicalOperatorOf(policy) === 'OR') {
    const nodes = policy.constraints.map((c): OdrlConstraintNode => {
      const atomics = constraintToOdrl(c);
      return atomics.length === 1 ? atomics[0] : { 'odrl:and': atomics };
    });
    return { 'odrl:or': nodes };
  }

  return { 'odrl:and': policy.constraints.flatMap(constraintToOdrl) };
}

export function policyToOdrl(policy: Policy): OdrlPolicyDefinition {
  const group = odrlConstraintGroup(policy);

  const permissionObj: OdrlPermission = {
    'odrl:action': { '@id': actionForCategory(policy.category) },
    ...(group && { 'odrl:constraint': group }),
  };

  return {
    '@context': ODRL_CONTEXT,
    '@type': 'PolicyDefinition',
    '@id': policy.policyId,
    policy: {
      '@context': 'http://www.w3.org/ns/odrl.jsonld',
      '@type': 'Set',
      'odrl:permission': [permissionObj],
      'odrl:prohibition': [],
      'odrl:obligation': [],
    },
  };
}
