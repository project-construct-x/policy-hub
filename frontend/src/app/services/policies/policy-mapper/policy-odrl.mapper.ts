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

export interface OdrlPolicy {
  '@context': typeof ODRL_CONTEXT;
  '@type': 'odrl:Set';
  '@id'?: string;
  'odrl:permission': {
    'odrl:action': { '@id': string };
    'odrl:constraint'?: OdrlAtomicConstraint | OdrlConstraintGroup;
  }[];
}

export function actionForCategory(category: PolicyCategory): string {
  return category === 'ACCESS' ? CX_ACCESS : ODRL_USE;
}

export function constraintToOdrl(c: Constraint): OdrlAtomicConstraint {
  switch (c.type) {
    case 'MEMBERSHIP':
      return {
        'odrl:leftOperand': { '@id': `${CX_POLICY_NS}Membership` },
        'odrl:operator': { '@id': 'odrl:eq' },
        'odrl:rightOperand': c.value,
      };
    case 'USE_CASE':
      return {
        'odrl:leftOperand': { '@id': `${CX_POLICY_NS}UsagePurpose` },
        'odrl:operator': { '@id': 'odrl:isAnyOf' },
        'odrl:rightOperand': c.useCases,
      };
    case 'END_DATE':
      return {
        'odrl:leftOperand': { '@id': `${CX_POLICY_NS}DataUsageEndDate` },
        'odrl:operator': { '@id': 'odrl:eq' },
        'odrl:rightOperand': c.endDate,
      };
    case 'FRAMEWORK_AGREEMENT':
      return {
        'odrl:leftOperand': { '@id': `${CX_POLICY_NS}FrameworkAgreement` },
        'odrl:operator': { '@id': 'odrl:eq' },
        'odrl:rightOperand': c.agreement,
      };
  }
}

export function policyToOdrl(policy: Policy): OdrlPolicy {
  const action = { '@id': actionForCategory(policy.category) };
  const atomics = policy.constraints.map(constraintToOdrl);

  const permission: OdrlPolicy['odrl:permission'][number] = { 'odrl:action': action };

  if (atomics.length === 1) {
    permission['odrl:constraint'] = atomics[0];
  } else if (atomics.length > 1) {
    permission['odrl:constraint'] = { 'odrl:and': atomics };
  }

  return {
    '@context': ODRL_CONTEXT,
    '@type': 'odrl:Set',
    '@id': policy.id ? `urn:constructx:policy:${policy.id}` : undefined,
    'odrl:permission': [permission],
  };
}
