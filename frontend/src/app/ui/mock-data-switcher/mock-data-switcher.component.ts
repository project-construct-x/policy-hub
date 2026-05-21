import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest, map, Observable } from 'rxjs';
import { mockDataCategories, MockDataCategory, MockDataMode } from '@mocks/mock-data-config';
import { initializePolicies } from '@mocks/data/policies/mocked-policies';

@Component({
  selector: 'app-mock-data-switcher',
  imports: [CommonModule],
  templateUrl: './mock-data-switcher.component.html',
  styleUrl: './mock-data-switcher.component.scss',
})
export class MockDataSwitcherComponent {
  private readonly router = inject(Router);

  categories: MockDataCategory[] = mockDataCategories;
  isExpanded = false;
  expandedCategory: string | null = null;

  readonly currentModes$: Observable<Map<string, string>> = combineLatest(
    this.categories.map((cat) => cat.currentMode$.pipe(map((mode) => ({ id: cat.id, mode })))),
  ).pipe(map((modes) => new Map(modes.map((m) => [m.id, m.mode]))));

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  toggleCategory(categoryId: string): void {
    this.expandedCategory = this.expandedCategory === categoryId ? null : categoryId;
  }

  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategory === categoryId;
  }

  switchMode(category: MockDataCategory, mode: MockDataMode): void {
    category.setMode(mode.value);
    initializePolicies();
    this.router.navigateByUrl(this.router.url);
  }

  getCurrentModeLabel(category: MockDataCategory): Observable<string> {
    return category.currentMode$.pipe(
      map((current) => {
        const mode = category.modes.find((m) => m.value === current);
        return mode ? `${mode.icon} ${mode.label}` : current;
      }),
    );
  }
}
