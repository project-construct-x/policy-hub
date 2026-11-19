import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';
import {
  CredentialRule,
  CredentialValueKind,
  credentialValueKind,
} from '@shared/types/constraint.model';
import {
  ValidationError,
  splitCredentialValues,
} from '@features/policies/builder/validators/constraint-validators';
import { buildDefaultCredentialRule } from '@features/policies/builder/metadata/constraint-metadata';
import {
  buildExpertRule,
  buildKnownPropertyRule,
  CREDENTIAL_OPERATOR_OPTIONS,
  KNOWN_CREDENTIALS,
  KnownCredentialProperty,
  knownPropertyById,
  knownPropertyOf,
} from '@features/policies/builder/metadata/credential-attribute.data';

type RuleField = 'credentialType' | 'attributePath' | 'operator' | 'value' | 'values';

/** Auswahlwert „Eigenes Merkmal“ (Gruppe „Erweitert“) in der Merkmal-Liste. */
const EXPERT_PROPERTY = 'expert';

/**
 * Editor der Credential-Regeln (ABAC). Je Regel wählt der Nutzer zuerst ein **Merkmal**:
 *
 * - Bekannte Merkmale (Registry `KNOWN_CREDENTIALS`, z.B. Partnerart oder Arbeitspakete) zeigen
 *   nur fachliche Felder: Vergleich in Alltagssprache und Checkboxen bzw. AP-Nummern.
 * - „Eigenes Merkmal“ (Gruppe „Erweitert“) zeigt die technischen Felder: Typ-IRI, Pfad im
 *   `credentialSubject`, Vergleich und Wert.
 *
 * Welche Ansicht gilt, ergibt sich allein aus der Regel (`knownPropertyOf`), es gibt keinen
 * zusätzlichen Zustand. Die Regeln sind per UND verknüpft; es gibt immer mindestens eine.
 * Fehler kommen aus der Submit-Validierung (`validateConstraint`) und werden je Feld angezeigt.
 */
@Component({
  selector: 'app-credential-rules-input',
  imports: [
    FormsModule,
    TranslocoDirective,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ConXButtonComponent,
  ],
  templateUrl: './credential-rules-input.component.html',
  styleUrl: './credential-rules-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CredentialRulesInputComponent {
  readonly rules = input.required<readonly CredentialRule[]>();
  /** Index des Constraints in der Policy; macht die Feldnamen im Formular eindeutig. */
  readonly constraintIndex = input.required<number>();
  /** Fehler aus der Submit-Validierung dieses Constraints, leer ohne Fehler. */
  readonly errors = input<readonly ValidationError[]>([]);

  readonly rulesChange = output<CredentialRule[]>();

  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly transloco = inject(TranslocoService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly expertProperty = EXPERT_PROPERTY;
  readonly knownCredentials = KNOWN_CREDENTIALS;
  readonly operatorOptions = CREDENTIAL_OPERATOR_OPTIONS;

  readonly rulesErrorKey = computed(
    () => this.errors().find((error) => error.field.endsWith('.rules'))?.messageKey ?? null,
  );

  /** Ein Matcher je Feld, damit `mat-error` und `aria-invalid` dem Validierungsergebnis folgen. */
  private readonly matchers = new Map<string, ErrorStateMatcher>();

  errorKey(ruleIndex: number, field: RuleField): string | null {
    const suffix = `.rules[${ruleIndex}].${field}`;
    return this.errors().find((error) => error.field.endsWith(suffix))?.messageKey ?? null;
  }

  errorStateMatcher(ruleIndex: number, field: RuleField): ErrorStateMatcher {
    const key = `${ruleIndex}.${field}`;
    let matcher = this.matchers.get(key);
    if (!matcher) {
      matcher = { isErrorState: () => !!this.errorKey(ruleIndex, field) };
      this.matchers.set(key, matcher);
    }
    return matcher;
  }

  fieldName(ruleIndex: number, field: string): string {
    return `credential-${this.constraintIndex()}-${ruleIndex}-${field}`;
  }

  knownProperty(rule: CredentialRule): KnownCredentialProperty | null {
    return knownPropertyOf(rule);
  }

  /** Auswahl in der Merkmal-Liste: das bekannte Merkmal oder der Expertenmodus. */
  propertySelection(rule: CredentialRule): string {
    return knownPropertyOf(rule)?.id ?? EXPERT_PROPERTY;
  }

  valueKind(rule: CredentialRule): CredentialValueKind {
    return credentialValueKind(rule.operator);
  }

  valuesText(rule: CredentialRule): string {
    return rule.values.join(', ');
  }

  isSelected(rule: CredentialRule, value: string): boolean {
    return rule.values.includes(value);
  }

  update(ruleIndex: number, patch: Partial<CredentialRule>): void {
    this.rulesChange.emit(
      this.rules().map((rule, index) => (index === ruleIndex ? { ...rule, ...patch } : rule)),
    );
  }

  /** Wechsel des Merkmals beginnt eine neue Regel; die Angaben des alten Merkmals passen nicht. */
  onPropertyChange(ruleIndex: number, propertyId: string): void {
    const property = knownPropertyById(propertyId);
    const rule = property ? buildKnownPropertyRule(property) : buildExpertRule();
    this.rulesChange.emit(
      this.rules().map((existing, index) => (index === ruleIndex ? rule : existing)),
    );
  }

  /** Checkbox eines Auswahlwerts; die Reihenfolge folgt der Registry. */
  onOptionToggle(ruleIndex: number, value: string, checked: boolean): void {
    const rule = this.rules()[ruleIndex];
    const property = knownPropertyOf(rule);
    if (!property) return;
    const values = property.options
      .map((option) => option.value)
      .filter((option) => (option === value ? checked : rule.values.includes(option)));
    this.update(ruleIndex, { values });
  }

  onValuesChange(ruleIndex: number, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.update(ruleIndex, { values: splitCredentialValues(raw) });
  }

  addRule(): void {
    const newIndex = this.rules().length;
    this.rulesChange.emit([...this.rules(), buildDefaultCredentialRule()]);
    void this.liveAnnouncer.announce(this.transloco.translate('a11y.credentialRules.added'));
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLElement>(`[data-cy="credential-rule-property-${newIndex}"]`)
          ?.focus(),
      { injector: this.injector },
    );
  }

  removeRule(ruleIndex: number): void {
    if (this.rules().length <= 1) return;
    this.rulesChange.emit(this.rules().filter((_rule, index) => index !== ruleIndex));
    void this.liveAnnouncer.announce(this.transloco.translate('a11y.credentialRules.removed'));
    // Der gedrückte Button verschwindet; der Fokus geht nicht verloren, sondern auf "Regel
    // hinzufügen".
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLElement>('[data-cy="credential-rule-add"]')
          ?.focus(),
      { injector: this.injector },
    );
  }
}
