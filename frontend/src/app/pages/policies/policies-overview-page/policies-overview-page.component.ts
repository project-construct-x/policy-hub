import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { EMPTY, catchError, of, switchMap, tap } from 'rxjs';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy, PolicyCategory } from '@shared/types/policy.model';
import { ConXPolicyTableComponent } from '@ui/policy-table/con-x-policy-table.component';
import { ConXEmptyStateComponent } from '@ui/empty-state/con-x-empty-state.component';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';
import { httpErrorMessageKey } from '@services/http/http-error.helper';
import { emptyPage } from '@services/http/page.helper';

@Component({
  selector: 'app-policies-overview-page',
  imports: [
    RouterLink,
    FormsModule,
    TranslocoDirective,
    ConXButtonComponent,
    ConXPolicyTableComponent,
    ConXEmptyStateComponent,
  ],
  templateUrl: './policies-overview-page.component.html',
  styleUrl: './policies-overview-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliciesOverviewPageComponent {
  private readonly policyService = inject(PolicyService);
  private readonly notification = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  readonly categoryOptions: PolicyCategory[] = ['ACCESS', 'CONTRACT'];

  /** Nur für den allerersten Ladevorgang: steuert Skeleton bzw. volle Fehleransicht. */
  loading = signal(true);
  error = signal(false);
  /** Für Seitenwechsel/Retry nach erfolgreichem Erstladen: Inhalt bleibt sichtbar. */
  pageLoading = signal(false);
  private hasLoadedOnce = signal(false);

  searchQuery = signal('');
  selectedCategory = signal<PolicyCategory | ''>('');
  currentPage = signal(1);
  pageSize = 8;
  private readonly reloadTrigger = signal(0);

  private readonly pageRequestKey = computed(() => `${this.currentPage()}:${this.reloadTrigger()}`);

  // `switchMap` verwirft überholte Antworten — ohne das könnte schnelles Klicken durch die
  // Seitenzahlen eine ältere Antwort zuletzt ankommen lassen.
  readonly page = toSignal(
    toObservable(this.pageRequestKey).pipe(
      switchMap(() => {
        this.pageLoading.set(true);
        return this.policyService
          .getPolicyPage({
            page: this.currentPage() - 1,
            size: this.pageSize,
            sort: 'updatedAt,desc',
          })
          .pipe(
            tap(() => {
              this.loading.set(false);
              this.pageLoading.set(false);
              this.error.set(false);
              this.hasLoadedOnce.set(true);
            }),
            catchError((err: unknown) => {
              this.pageLoading.set(false);
              this.notification.error(
                this.transloco.translate(
                  httpErrorMessageKey(err, 'policies.notifications.loadError'),
                ),
              );
              if (this.hasLoadedOnce()) {
                // Vorherigen Inhalt stehen lassen statt ihn durch eine leere Seite zu ersetzen.
                return EMPTY;
              }
              this.loading.set(false);
              this.error.set(true);
              return of(emptyPage<Policy>());
            }),
          );
      }),
    ),
    { initialValue: emptyPage<Policy>() },
  );

  readonly isFiltered = computed(() => !!this.searchQuery().trim() || !!this.selectedCategory());

  readonly filteredPolicies = computed(() => {
    let result = this.page().content;
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();

    if (query) {
      result = result.filter((p) => p.policyId.toLowerCase().includes(query));
    }

    if (category) {
      result = result.filter((p) => p.category === category);
    }

    return result;
  });

  readonly totalPages = computed(() => this.page().totalPages);

  // Nur für die unveränderte Bedeutung von policies.pagination.info: bezieht sich auf die
  // gesamte Collection, nicht auf den clientseitig gefilterten Ausschnitt.
  paginationRange = computed(() => {
    const p = this.page();
    const start = p.number * p.size + 1;
    const end = p.number * p.size + p.numberOfElements;
    return { start, end, total: p.totalElements };
  });

  // Solange das Backend keine Such-/Filterparameter kennt, wirkt ein aktiver Filter nur auf die
  // bereits geladene Seite — der Text muss das benennen, statt eine Gesamtzahl vorzutäuschen.
  filteredPaginationInfo = computed(() => ({
    count: this.filteredPolicies().length,
    pageTotal: this.page().numberOfElements,
    page: this.currentPage(),
    totalPages: this.page().totalPages,
  }));

  constructor() {
    // Springt eine Seite zurück, wenn die angeforderte Seite leer zurückkommt (z.B. nach dem
    // Löschen des letzten Eintrags einer höheren Seite) — sonst bliebe die Ansicht leer stehen.
    effect(() => {
      const p = this.page();
      if (p.numberOfElements === 0 && p.number > 0) {
        this.currentPage.set(p.number);
      }
    });
  }

  retry(): void {
    this.loading.set(true);
    this.error.set(false);
    this.reloadTrigger.update((v) => v + 1);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onCategoryFilter(value: string): void {
    this.selectedCategory.set((value as PolicyCategory) || '');
    this.currentPage.set(1);
  }

  goToPage(targetPage: number): void {
    if (targetPage < 1 || targetPage > this.totalPages() || targetPage === this.currentPage()) {
      return;
    }
    this.currentPage.set(targetPage);
    void this.liveAnnouncer.announce(
      this.transloco.translate('a11y.pagination.announce', {
        page: targetPage,
        totalPages: this.totalPages(),
      }),
    );
  }
}
