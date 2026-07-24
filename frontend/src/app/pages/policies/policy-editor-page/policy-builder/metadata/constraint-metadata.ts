import { ConstraintType, Operator } from '@shared/types/constraint.model';
import { PolicyCategory } from '@shared/types/policy.model';

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
  MEMBERSHIP: {
    type: 'MEMBERSHIP',
    labelKey: 'constraint.MEMBERSHIP.label',
    descriptionKey: 'constraint.MEMBERSHIP.description',
    legalTextKey: 'constraint.MEMBERSHIP.legalText',
    icon: 'verified_user',
    defaultOperator: 'eq',
    allowedIn: ['ACCESS', 'CONTRACT'],
  },
  USE_CASE: {
    type: 'USE_CASE',
    labelKey: 'constraint.USE_CASE.label',
    descriptionKey: 'constraint.USE_CASE.description',
    legalTextKey: 'constraint.USE_CASE.legalText',
    icon: 'category',
    defaultOperator: 'isAnyOf',
    allowedIn: ['ACCESS', 'CONTRACT'],
  },
  DATE_RANGE: {
    type: 'DATE_RANGE',
    labelKey: 'constraint.DATE_RANGE.label',
    descriptionKey: 'constraint.DATE_RANGE.description',
    legalTextKey: 'constraint.DATE_RANGE.legalText',
    icon: 'date_range',
    defaultOperator: 'lteq',
    allowedIn: ['ACCESS', 'CONTRACT'],
  },
  FRAMEWORK_AGREEMENT: {
    type: 'FRAMEWORK_AGREEMENT',
    labelKey: 'constraint.FRAMEWORK_AGREEMENT.label',
    descriptionKey: 'constraint.FRAMEWORK_AGREEMENT.description',
    legalTextKey: 'constraint.FRAMEWORK_AGREEMENT.legalText',
    icon: 'assignment_turned_in',
    defaultOperator: 'eq',
    allowedIn: ['ACCESS', 'CONTRACT'],
  },
};

export const ALL_CONSTRAINT_TYPES: ConstraintType[] = [
  'MEMBERSHIP',
  'USE_CASE',
  'DATE_RANGE',
  'FRAMEWORK_AGREEMENT',
];

export function getAllowedConstraintTypes(category: PolicyCategory): ConstraintType[] {
  return ALL_CONSTRAINT_TYPES.filter((t) => CONSTRAINT_METADATA[t].allowedIn.includes(category));
}

export function buildDefaultConstraint(
  type: ConstraintType,
): import('@shared/types/constraint.model').Constraint {
  switch (type) {
    case 'MEMBERSHIP':
      return { type: 'MEMBERSHIP', value: 'active' };
    case 'USE_CASE':
      return { type: 'USE_CASE', useCases: [] };
    case 'DATE_RANGE':
      return { type: 'DATE_RANGE', startDate: '', endDate: '' };
    case 'FRAMEWORK_AGREEMENT':
      return { type: 'FRAMEWORK_AGREEMENT', agreement: 'DataExchangeGovernance' };
  }
}
