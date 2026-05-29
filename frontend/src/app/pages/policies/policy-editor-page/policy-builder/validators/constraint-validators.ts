import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';

export interface ValidationError {
  field: string;
  messageKey: string;
}

export const POLICY_ID_PATTERN = /^.{1,200}$/;

export function validatePolicyDraft(draft: Partial<Policy>): ValidationError[] {
  const errors: ValidationError[] = [];

  const id = (draft.policyId ?? '').trim();
  if (!id) {
    errors.push({ field: 'policyId', messageKey: 'validation.policyIdRequired' });
  } else if (id.length > 200) {
    errors.push({ field: 'policyId', messageKey: 'validation.policyIdTooLong' });
  }

  if (!draft.category) {
    errors.push({ field: 'category', messageKey: 'validation.categoryRequired' });
  }

  for (const [index, c] of (draft.constraints ?? []).entries()) {
    // Check category compatibility
    if (draft.category && !CONSTRAINT_METADATA[c.type].allowedIn.includes(draft.category)) {
      errors.push({
        field: `constraint[${index}]`,
        messageKey: 'validation.constraintNotAllowedInCategory',
      });
    }
    errors.push(...validateConstraint(c, index));
  }

  return errors;
}

export function validateConstraint(constraint: Constraint, index = 0): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `constraint[${index}]`;

  switch (constraint.type) {
    case 'END_DATE': {
      if (!constraint.endDate) {
        errors.push({ field: `${prefix}.endDate`, messageKey: 'validation.endDateRequired' });
      } else {
        const date = new Date(constraint.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(date.getTime())) {
          errors.push({ field: `${prefix}.endDate`, messageKey: 'validation.endDateInvalid' });
        } else if (date < today) {
          errors.push({ field: `${prefix}.endDate`, messageKey: 'validation.endDateInPast' });
        }
      }
      break;
    }
    case 'USE_CASE': {
      if (!constraint.useCases || constraint.useCases.length === 0) {
        errors.push({ field: `${prefix}.useCases`, messageKey: 'validation.useCaseRequired' });
      }
      break;
    }
    case 'MEMBERSHIP':
    case 'FRAMEWORK_AGREEMENT':
      break;
  }

  return errors;
}
