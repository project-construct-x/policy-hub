import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';
import {
  DataSubsetSelectorKind,
  parseDataSubsetSelector,
  partitionCandidates,
  splitDataSubsetInput,
  toDataSubsetSelector,
  validateSelectorCandidate,
} from '@features/policies/builder/validators/constraint-validators';
import {
  DATA_SUBSET_KIND_OPTIONS,
  dataSubsetKindOption,
} from '@features/policies/builder/metadata/data-subset.data';

/**
 * Eingabe der Teildatensätze: Art aus einer Auswahlliste (Feld, Merkmal, Submodell, Record),
 * dazu der Name. Übernommen wird per Enter, "Hinzufügen" oder beim Verlassen der Eingabe; mehrere
 * eingefügte Namen (getrennt durch Komma oder Zeilenumbruch) werden einzeln übernommen.
 * Gespeichert wird je Eintrag der Selektor `<art>:<name>`.
 *
 * Ungültige oder doppelte Namen bleiben zur Korrektur im Feld stehen; solange dort Text steht,
 * meldet `pendingInputChange` `true` und der Builder blockiert das Speichern.
 */
@Component({
  selector: 'app-data-subset-input',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ConXButtonComponent,
  ],
  templateUrl: './data-subset-input.component.html',
  styleUrl: './data-subset-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSubsetInputComponent {
  readonly selectors = input.required<readonly string[]>();
  /** Fehler aus der Submit-Validierung (`validateConstraint`), `null` ohne Fehler. */
  readonly submitErrorKey = input<string | null>(null);

  readonly selectorsChange = output<string[]>();
  readonly pendingInputChange = output<boolean>();

  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly transloco = inject(TranslocoService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly kindOptions = DATA_SUBSET_KIND_OPTIONS;
  readonly kind = signal<DataSubsetSelectorKind>('field');
  readonly kindOption = computed(() => dataSubsetKindOption(this.kind()));

  /** Einträge als Art (Label-Key) + Name für die Chips; ungültige Werte unverändert. */
  readonly entries = computed(() =>
    this.selectors().map((selector) => {
      const parsed = parseDataSubsetSelector(selector);
      return {
        selector,
        labelKey: parsed ? dataSubsetKindOption(parsed.kind).labelKey : null,
        identifier: parsed?.identifier ?? selector,
      };
    }),
  );

  /** Fehler der letzten Eingabe; hat Vorrang vor dem Submit-Fehler. */
  readonly inputErrorKey = signal<string | null>(null);
  readonly errorKey = computed(() => this.inputErrorKey() ?? this.submitErrorKey());

  /** Zuletzt über `pendingInputChange` gemeldeter Zustand (nur Änderungen werden gemeldet). */
  private hasPendingInput = false;

  // Der Validator spiegelt den Fehlerzustand, damit `aria-invalid` gesetzt wird und der Builder
  // nach einem fehlgeschlagenen Submit hierher fokussiert.
  readonly identifierControl = new FormControl('', {
    nonNullable: true,
    validators: () => (this.errorKey() ? { dataSubset: true } : null),
  });

  // `mat-error` erscheint nur bei errorState=true — sofort, nicht erst nach touched/submitted.
  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => !!this.errorKey(),
  };

  constructor() {
    effect(() => {
      this.errorKey();
      this.identifierControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  onKindChange(kind: DataSubsetSelectorKind): void {
    this.kind.set(kind);
    this.inputErrorKey.set(null);
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.add();
  }

  /** Verlassen der Eingabe übernimmt den Text — außer der Fokus bleibt in dieser Komponente. */
  onBlur(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    // Die Auswahlliste der Arten öffnet sich in einem Overlay außerhalb der Komponente.
    if (next instanceof HTMLElement && next.closest('.cdk-overlay-container')) return;
    this.add();
  }

  onPaste(event: ClipboardEvent): void {
    const parts = splitDataSubsetInput(event.clipboardData?.getData('text') ?? '');
    // Ein einzelner Wert wird normal eingefügt und erst mit Enter/Hinzufügen übernommen.
    if (parts.length < 2) return;
    event.preventDefault();
    this.addIdentifiers([...splitDataSubsetInput(this.identifierControl.value), ...parts]);
  }

  onInput(): void {
    this.inputErrorKey.set(null);
    this.setPendingInput(this.identifierControl.value);
  }

  add(): void {
    this.addIdentifiers(splitDataSubsetInput(this.identifierControl.value));
  }

  remove(selector: string): void {
    this.inputErrorKey.set(null);
    this.selectorsChange.emit(this.selectors().filter((s) => s !== selector));
    void this.liveAnnouncer.announce(this.transloco.translate('a11y.dataSubset.removed'));
  }

  private addIdentifiers(identifiers: string[]): void {
    if (!identifiers.length) {
      this.identifierControl.setValue('');
      this.setPendingInput('');
      return;
    }

    const kind = this.kind();
    const { accepted, rejected, errorKey } = partitionCandidates(
      identifiers.map((identifier) => toDataSubsetSelector(kind, identifier)),
      this.selectors(),
      validateSelectorCandidate,
    );

    // Abgelehnte Namen (ohne Art-Präfix) bleiben zur Korrektur im Feld stehen.
    const prefix = toDataSubsetSelector(kind, '');
    this.identifierControl.setValue(rejected.map((s) => s.slice(prefix.length)).join(', '));
    this.setPendingInput(this.identifierControl.value);
    this.inputErrorKey.set(errorKey);

    if (accepted.length) {
      this.selectorsChange.emit([...this.selectors(), ...accepted]);
    }
    const message = errorKey
      ? this.transloco.translate(errorKey)
      : this.transloco.translate('a11y.dataSubset.added', { count: accepted.length });
    void this.liveAnnouncer.announce(message, errorKey ? 'assertive' : 'polite');
  }

  private setPendingInput(value: string): void {
    const pending = value.trim() !== '';
    if (pending === this.hasPendingInput) return;
    this.hasPendingInput = pending;
    this.pendingInputChange.emit(pending);
  }
}
