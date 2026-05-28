import { ConstraintType } from '@shared/types/constraint.model';
import { PolicyCategory, PolicyType } from '@shared/types/policy.model';

export interface PolicyTypeMetadata {
  type: PolicyType;
  labelKey: string;
  descriptionKey: string;
  icon: string;
  allowedCategories: PolicyCategory[];
  requiredConstraints: ConstraintType[];
}

export const POLICY_TYPE_METADATA: Record<PolicyType, PolicyTypeMetadata> = {
  ALWAYS_TRUE: {
    type: 'ALWAYS_TRUE',
    labelKey: 'policyType.ALWAYS_TRUE.label',
    descriptionKey: 'policyType.ALWAYS_TRUE.description',
    icon: 'all_inclusive',
    allowedCategories: ['ACCESS', 'CONTRACT'],
    requiredConstraints: [],
  },
  MEMBERSHIP_STATIC: {
    type: 'MEMBERSHIP_STATIC',
    labelKey: 'policyType.MEMBERSHIP_STATIC.label',
    descriptionKey: 'policyType.MEMBERSHIP_STATIC.description',
    icon: 'verified_user',
    allowedCategories: ['ACCESS', 'CONTRACT'],
    requiredConstraints: ['MEMBERSHIP'],
  },
  USE_CASE_MEMBERSHIP: {
    type: 'USE_CASE_MEMBERSHIP',
    labelKey: 'policyType.USE_CASE_MEMBERSHIP.label',
    descriptionKey: 'policyType.USE_CASE_MEMBERSHIP.description',
    icon: 'category',
    allowedCategories: ['ACCESS', 'CONTRACT'],
    requiredConstraints: ['USE_CASE'],
  },
  END_DATE: {
    type: 'END_DATE',
    labelKey: 'policyType.END_DATE.label',
    descriptionKey: 'policyType.END_DATE.description',
    icon: 'event_busy',
    allowedCategories: ['ACCESS', 'CONTRACT'],
    requiredConstraints: ['END_DATE'],
  },
  FRAMEWORK_AGREEMENT: {
    type: 'FRAMEWORK_AGREEMENT',
    labelKey: 'policyType.FRAMEWORK_AGREEMENT.label',
    descriptionKey: 'policyType.FRAMEWORK_AGREEMENT.description',
    icon: 'assignment_turned_in',
    allowedCategories: ['ACCESS', 'CONTRACT'],
    requiredConstraints: ['FRAMEWORK_AGREEMENT'],
  },
};

export const ALL_POLICY_TYPES: PolicyType[] = [
  'ALWAYS_TRUE',
  'MEMBERSHIP_STATIC',
  'USE_CASE_MEMBERSHIP',
  'END_DATE',
  'FRAMEWORK_AGREEMENT',
];

export function getPolicyTypesForCategory(category: PolicyCategory): PolicyTypeMetadata[] {
  return ALL_POLICY_TYPES.map((t) => POLICY_TYPE_METADATA[t]).filter((m) =>
    m.allowedCategories.includes(category),
  );
}
