import { TranslocoService } from '@jsverse/transloco';
import { Constraint } from '@shared/types/constraint.model';
import { Policy } from '@shared/types/policy.model';
import { POLICY_TYPE_METADATA } from '@features/policies/builder/metadata/policy-type-metadata';

export function buildPolicySummary(
  policy: Pick<Policy, 'category' | 'type' | 'constraints'>,
  transloco: TranslocoService,
): string {
  const categoryLabel = transloco.translate(`policyCategory.${policy.category}.label`);
  const typeMeta = POLICY_TYPE_METADATA[policy.type];
  const typeLabel = transloco.translate(typeMeta.labelKey);

  const constraintParts = policy.constraints
    .map((c) => formatConstraintSummary(c, transloco))
    .filter((s) => s.length > 0);

  let summary = `${categoryLabel} · ${typeLabel}`;
  if (constraintParts.length > 0) {
    summary += ' — ' + constraintParts.join(' und ');
  }
  return summary;
}

export function formatConstraintSummary(c: Constraint, transloco: TranslocoService): string {
  switch (c.type) {
    case 'MEMBERSHIP':
      return transloco.translate('policySummary.constraint.MEMBERSHIP');
    case 'USE_CASE': {
      if (!c.useCases || c.useCases.length === 0) {
        return transloco.translate('policySummary.constraint.USE_CASE.empty');
      }
      const labels = c.useCases.map((id) =>
        transloco.translate(`useCase.${id.replace('UC.', '')}`),
      );
      return transloco.translate('policySummary.constraint.USE_CASE.list', {
        list: labels.join(', '),
      });
    }
    case 'END_DATE': {
      if (!c.endDate) {
        return transloco.translate('policySummary.constraint.END_DATE.empty');
      }
      const formatted = formatDate(c.endDate);
      return transloco.translate('policySummary.constraint.END_DATE.value', { date: formatted });
    }
    case 'FRAMEWORK_AGREEMENT':
      return transloco.translate('policySummary.constraint.FRAMEWORK_AGREEMENT', {
        agreement: c.agreement,
      });
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return iso;
  }
}
