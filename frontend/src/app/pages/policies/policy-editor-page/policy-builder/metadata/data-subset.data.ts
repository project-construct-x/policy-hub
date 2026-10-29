import { DataSubsetSelectorKind } from '@features/policies/builder/validators/constraint-validators';

export interface DataSubsetKindOption {
  kind: DataSubsetSelectorKind;
  /** Anzeigename der Art (Auswahlliste, Chips, Rechtstext). */
  labelKey: string;
  /** Erklärung mit Beispiel, erscheint unter dem Eingabefeld für den Namen. */
  hintKey: string;
}

/**
 * Auswahlliste der Teildatensatz-Arten. i18n-Keys bewusst ausgeschrieben statt aus der Art
 * zusammengesetzt (i18n-Regel: keine dynamischen Keys).
 */
export const DATA_SUBSET_KIND_OPTIONS: readonly DataSubsetKindOption[] = [
  {
    kind: 'field',
    labelKey: 'constraint.DATA_SUBSET.kind.field',
    hintKey: 'policyBuilder.constraint.DATA_SUBSET.hint.field',
  },
  {
    kind: 'attribute',
    labelKey: 'constraint.DATA_SUBSET.kind.attribute',
    hintKey: 'policyBuilder.constraint.DATA_SUBSET.hint.attribute',
  },
  {
    kind: 'submodel',
    labelKey: 'constraint.DATA_SUBSET.kind.submodel',
    hintKey: 'policyBuilder.constraint.DATA_SUBSET.hint.submodel',
  },
  {
    kind: 'record',
    labelKey: 'constraint.DATA_SUBSET.kind.record',
    hintKey: 'policyBuilder.constraint.DATA_SUBSET.hint.record',
  },
];

export function dataSubsetKindOption(kind: DataSubsetSelectorKind): DataSubsetKindOption {
  return DATA_SUBSET_KIND_OPTIONS.find((o) => o.kind === kind) ?? DATA_SUBSET_KIND_OPTIONS[0];
}
