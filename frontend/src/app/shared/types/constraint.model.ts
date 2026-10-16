export type ConstraintType = 'MEMBERSHIP' | 'DATE_RANGE' | 'FRAMEWORK_AGREEMENT';

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

export type Constraint = MembershipConstraint | DateRangeConstraint | FrameworkAgreementConstraint;
