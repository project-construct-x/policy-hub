import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Policy } from '@shared/types/policy.model';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-cx-policy-table',
  imports: [RouterLink, TranslocoDirective, RelativeDatePipe],
  templateUrl: './cx-policy-table.component.html',
  styleUrl: './cx-policy-table.component.scss',
})
export class CxPolicyTableComponent {
  policies = input.required<Policy[]>();
  showDescription = input(true);
  showHeader = input(true);
  showAction = input(true);
}
