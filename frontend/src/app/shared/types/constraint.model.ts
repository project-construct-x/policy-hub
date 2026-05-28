export type ConstraintType = 'MEMBERSHIP' | 'USE_CASE' | 'END_DATE' | 'FRAMEWORK_AGREEMENT';

export type Operator = 'eq' | 'isAnyOf';

export interface MembershipConstraint {
  type: 'MEMBERSHIP';
  value: 'active';
}

export interface UseCaseConstraint {
  type: 'USE_CASE';
  useCases: string[];
}

export interface EndDateConstraint {
  type: 'END_DATE';
  endDate: string; // ISO-8601
}

export interface FrameworkAgreementConstraint {
  type: 'FRAMEWORK_AGREEMENT';
  agreement: string;
}

export type Constraint =
  | MembershipConstraint
  | UseCaseConstraint
  | EndDateConstraint
  | FrameworkAgreementConstraint;
