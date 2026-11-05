import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {
  partitionCandidates,
  splitListInput,
  validateDidCandidate,
} from '@features/policies/builder/validators/constraint-validators';

/**
 * Chip-Eingabe für eine Liste von `did:web`-Identitäten (Vorbild: Participant Constraints der
 * HTX Connector UI). Ein Eintrag wird per Enter, Komma, Verlassen des Felds oder Einfügen zum
 * Chip. Ungültige oder doppelte Einträge werden nicht übernommen, sondern bleiben im Feld stehen
 * und werden sofort als Fehler angezeigt und angesagt.
 *
 * Solange Text im Feld steht, der kein Chip geworden ist, meldet `pendingInputChange` `true`;
 * der Builder blockiert dann das Speichern.
 */
@Component({
  selector: 'app-participant-did-input',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  templateUrl: './participant-did-input.component.html',
  styleUrl: './participant-did-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantDidInputComponent {
  readonly dids = input.required<readonly string[]>();
  /** Fehler aus der Submit-Validierung (`validateConstraint`), `null` ohne Fehler. */
  readonly submitErrorKey = input<string | null>(null);

  readonly didsChange = output<string[]>();
  readonly pendingInputChange = output<boolean>();

  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly transloco = inject(TranslocoService);

  readonly separatorKeyCodes = [ENTER, COMMA] as const;

  /** Fehler der letzten Eingabe; hat Vorrang vor dem Submit-Fehler. */
  readonly inputErrorKey = signal<string | null>(null);
  readonly errorKey = computed(() => this.inputErrorKey() ?? this.submitErrorKey());

  /** Zuletzt über `pendingInputChange` gemeldeter Zustand (nur Änderungen werden gemeldet). */
  private hasPendingInput = false;

  // `MatChipInput` setzt `aria-invalid` aus `ngControl.invalid`. Der Validator spiegelt deshalb
  // den Fehlerzustand, damit der Builder nach einem fehlgeschlagenen Submit hierher fokussiert.
  readonly control = new FormControl<readonly string[]>([], {
    nonNullable: true,
    validators: () => (this.errorKey() ? { participantDid: true } : null),
  });

  // `mat-error` erscheint nur bei errorState=true — sofort, nicht erst nach touched/submitted.
  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => !!this.errorKey(),
  };

  constructor() {
    effect(() => {
      this.errorKey();
      this.control.setValue(this.dids(), { emitEvent: false });
    });
  }

  onTokenEnd(event: MatChipInputEvent): void {
    this.addCandidates(event.input, splitListInput(event.value));
  }

  onPaste(event: ClipboardEvent): void {
    const parts = splitListInput(event.clipboardData?.getData('text') ?? '');
    // Ein einzelner Wert wird normal eingefügt und erst mit Enter/Komma/Blur übernommen.
    if (parts.length < 2) return;
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    this.addCandidates(input, [...splitListInput(input.value), ...parts]);
  }

  onInput(event: Event): void {
    this.inputErrorKey.set(null);
    this.setPendingInput((event.target as HTMLInputElement).value);
  }

  remove(did: string): void {
    this.inputErrorKey.set(null);
    this.didsChange.emit(this.dids().filter((d) => d !== did));
    void this.liveAnnouncer.announce(this.transloco.translate('a11y.participantDid.removed'));
  }

  private addCandidates(input: HTMLInputElement, candidates: string[]): void {
    if (!candidates.length) {
      input.value = '';
      this.setPendingInput('');
      return;
    }

    const { accepted, rejected, errorKey } = partitionCandidates(
      candidates,
      this.dids(),
      validateDidCandidate,
    );

    // Abgelehnte Einträge bleiben zur Korrektur im Feld stehen.
    input.value = rejected.join(', ');
    this.setPendingInput(input.value);
    this.inputErrorKey.set(errorKey);

    if (accepted.length) {
      this.didsChange.emit([...this.dids(), ...accepted]);
    }
    const message = errorKey
      ? this.transloco.translate(errorKey)
      : this.transloco.translate('a11y.participantDid.added', { count: accepted.length });
    void this.liveAnnouncer.announce(message, errorKey ? 'assertive' : 'polite');
  }

  private setPendingInput(value: string): void {
    const pending = value.trim() !== '';
    if (pending === this.hasPendingInput) return;
    this.hasPendingInput = pending;
    this.pendingInputChange.emit(pending);
  }
}
