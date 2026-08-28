import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PolicyService } from '@services/policies/policy.service';
import { NotificationService } from '@services/notification/notification.service';
import { Policy } from '@shared/types/policy.model';
import { ConXPolicyTableComponent } from '@ui/policy-table/con-x-policy-table.component';
import { ConXEmptyStateComponent } from '@ui/empty-state/con-x-empty-state.component';
import { ConXButtonComponent } from '@ui/button/con-x-button.component';
import { httpErrorMessageKey } from '@services/http/http-error.helper';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    TranslocoDirective,
    ConXButtonComponent,
    ConXPolicyTableComponent,
    ConXEmptyStateComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
  private readonly policyService = inject(PolicyService);
  private readonly notification = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  policyCount = signal(0);
  recentPolicies = signal<Policy[]>([]);

  ngOnInit(): void {
    this.policyService.getPolicyPage({ page: 0, size: 3, sort: 'updatedAt,desc' }).subscribe({
      next: (page) => {
        this.policyCount.set(page.totalElements);
        this.recentPolicies.set(page.content);
      },
      error: (err: unknown) => {
        this.notification.error(
          this.transloco.translate(httpErrorMessageKey(err, 'home.notifications.loadError')),
        );
      },
    });
  }
}
