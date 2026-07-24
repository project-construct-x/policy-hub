import { Constraint } from '@shared/types/constraint.model';
import { Policy, PolicyCategory } from '@shared/types/policy.model';

const CX_POLICY_NS = 'https://w3id.org/catenax/2025/9/policy/';
const ODRL_USE = 'odrl:use';
const CX_ACCESS = `${CX_POLICY_NS}access`;

const ODRL_CONTEXT = {
  '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
  edc: 'https://w3id.org/edc/v0.0.1/ns/',
  odrl: 'http://www.w3.org/ns/odrl/2/',
};

interface OdrlAtomicConstraint {
  'odrl:leftOperand': { '@id': string };
  'odrl:operator': { '@id': string };
  'odrl:rightOperand': string | string[];
}

interface OdrlConstraintGroup {
  'odrl:and': OdrlAtomicConstraint[];
}

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
 * Ende via `lteq`), die in `policyToOdrl` per `flatMap` zusammengeführt werden.
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
    case 'USE_CASE':
      return [
        {
          'odrl:leftOperand': { '@id': `${CX_POLICY_NS}UsagePurpose` },
          'odrl:operator': { '@id': 'odrl:isAnyOf' },
          'odrl:rightOperand': c.useCases,
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
  }
}

export function policyToOdrl(policy: Policy): OdrlPolicyDefinition {
  const atomics = policy.constraints.flatMap(constraintToOdrl);

  const permissionObj: OdrlPermission = {
    'odrl:action': { '@id': actionForCategory(policy.category) },
    ...(atomics.length > 0 && { 'odrl:constraint': { 'odrl:and': atomics } }),
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
