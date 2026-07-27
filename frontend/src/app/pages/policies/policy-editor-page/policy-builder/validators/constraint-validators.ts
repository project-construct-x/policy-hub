import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';
import { CONSTRAINT_METADATA } from '@features/policies/builder/metadata/constraint-metadata';

export interface ValidationError {
  field: string;
  messageKey: string;
}

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
    case 'DATE_RANGE': {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = validateDate(
        constraint.startDate,
        `${prefix}.startDate`,
        'dateRangeStartRequired',
        'dateRangeStartInvalid',
        'dateRangeStartInPast',
        today,
        errors,
      );
      const end = validateDate(
        constraint.endDate,
        `${prefix}.endDate`,
        'dateRangeEndRequired',
        'dateRangeEndInvalid',
        'dateRangeEndInPast',
        today,
        errors,
      );

      // Cross-Field: Start darf nicht nach dem Ende liegen (nur prüfen, wenn beide gültig sind).
      if (start && end && start > end) {
        errors.push({ field: `${prefix}.endDate`, messageKey: 'validation.dateRangeStartAfterEnd' });
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

/**
 * Validiert ein einzelnes Pflicht-Datum (required + parsebar + nicht in der Vergangenheit)
 * und hängt gefundene Fehler an `errors`. Gibt bei gültigem Wert das `Date` zurück, sonst `null`
 * (für die anschließende Start-≤-Ende-Prüfung).
 */
function validateDate(
  value: string,
  field: string,
  requiredKey: string,
  invalidKey: string,
  inPastKey: string,
  today: Date,
  errors: ValidationError[],
): Date | null {
  if (!value) {
    errors.push({ field, messageKey: `validation.${requiredKey}` });
    return null;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push({ field, messageKey: `validation.${invalidKey}` });
    return null;
  }
  if (date < today) {
    errors.push({ field, messageKey: `validation.${inPastKey}` });
    return null;
  }
  return date;
}
