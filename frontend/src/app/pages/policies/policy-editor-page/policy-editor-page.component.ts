import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { CxButtonComponent } from '@ui/button/cx-button.component';

@Component({
  selector: 'app-policy-editor-page',
  imports: [TranslocoDirective, CxButtonComponent],
  templateUrl: './policy-editor-page.component.html',
  styleUrl: './policy-editor-page.component.scss',
})
export class PolicyEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isEditMode = signal(false);
  policyId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.policyId.set(id);
    }
  }

  goBack(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/policies', this.policyId()]);
    } else {
      this.router.navigate(['/policies']);
    }
  }
}
