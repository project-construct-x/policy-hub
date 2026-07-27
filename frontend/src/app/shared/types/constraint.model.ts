export type ConstraintType = 'MEMBERSHIP' | 'USE_CASE' | 'DATE_RANGE' | 'FRAMEWORK_AGREEMENT';

export type Operator = 'eq' | 'isAnyOf' | 'gteq' | 'lteq';

export interface MembershipConstraint {
  type: 'MEMBERSHIP';
  value: 'active';
}

export interface UseCaseConstraint {
  type: 'USE_CASE';
  useCases: string[];
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

export type Constraint =
  | MembershipConstraint
  | UseCaseConstraint
  | DateRangeConstraint
  | FrameworkAgreementConstraint;
