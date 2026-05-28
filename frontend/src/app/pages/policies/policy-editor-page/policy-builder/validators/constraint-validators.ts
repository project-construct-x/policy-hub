import { Constraint } from '@shared/types/constraint.model';
import { Policy, PolicyType } from '@shared/types/policy.model';

export interface ValidationError {
  field: string;
  messageKey: string;
}

export function validatePolicyDraft(draft: Partial<Policy>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!draft.name || draft.name.trim().length === 0) {
    errors.push({ field: 'name', messageKey: 'validation.nameRequired' });
  } else if (draft.name.length > 200) {
    errors.push({ field: 'name', messageKey: 'validation.nameTooLong' });
  }

  if (!draft.category) {
    errors.push({ field: 'category', messageKey: 'validation.categoryRequired' });
  }

  if (!draft.type) {
    errors.push({ field: 'type', messageKey: 'validation.policyTypeRequired' });
  }

  for (const c of draft.constraints ?? []) {
    errors.push(...validateConstraint(c));
  }

  return errors;
}

export function validateConstraint(constraint: Constraint): ValidationError[] {
  const errors: ValidationError[] = [];

  switch (constraint.type) {
    case 'END_DATE': {
      if (!constraint.endDate) {
        errors.push({ field: 'endDate', messageKey: 'validation.endDateRequired' });
      } else {
        const date = new Date(constraint.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(date.getTime())) {
          errors.push({ field: 'endDate', messageKey: 'validation.endDateInvalid' });
        } else if (date < today) {
          errors.push({ field: 'endDate', messageKey: 'validation.endDateInPast' });
        }
      }
      break;
    }
    case 'USE_CASE': {
      if (!constraint.useCases || constraint.useCases.length === 0) {
        errors.push({ field: 'useCases', messageKey: 'validation.useCaseRequired' });
      }
      break;
    }
    case 'MEMBERSHIP':
    case 'FRAMEWORK_AGREEMENT':
      break;
  }

  return errors;
}

export function buildDefaultConstraintsForType(type: PolicyType): Constraint[] {
  switch (type) {
    case 'ALWAYS_TRUE':
      return [];
    case 'MEMBERSHIP_STATIC':
      return [{ type: 'MEMBERSHIP', value: 'active' }];
    case 'USE_CASE_MEMBERSHIP':
      return [{ type: 'USE_CASE', useCases: [] }];
    case 'END_DATE':
      return [{ type: 'END_DATE', endDate: '' }];
    case 'FRAMEWORK_AGREEMENT':
      return [{ type: 'FRAMEWORK_AGREEMENT', agreement: 'DataExchangeGovernance' }];
  }
}
