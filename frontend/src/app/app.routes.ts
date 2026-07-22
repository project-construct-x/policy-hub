import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'a11y.pageTitle.home',
    loadComponent: () => import('@pages/home/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'policies',
    title: 'a11y.pageTitle.policies',
    loadComponent: () =>
      import('@pages/policies/policies-overview-page/policies-overview-page.component').then(
        (m) => m.PoliciesOverviewPageComponent,
      ),
  },
  {
    path: 'policies/new',
    title: 'a11y.pageTitle.policyNew',
    loadComponent: () =>
      import('@pages/policies/policy-editor-page/policy-editor-page.component').then(
        (m) => m.PolicyEditorPageComponent,
      ),
  },
  {
    path: 'policies/:id',
    title: 'a11y.pageTitle.policyDetail',
    loadComponent: () =>
      import('@pages/policies/policy-detail-page/policy-detail-page.component').then(
        (m) => m.PolicyDetailPageComponent,
      ),
  },
  {
    path: 'policies/:id/edit',
    title: 'a11y.pageTitle.policyEdit',
    loadComponent: () =>
      import('@pages/policies/policy-editor-page/policy-editor-page.component').then(
        (m) => m.PolicyEditorPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
