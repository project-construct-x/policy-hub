import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@pages/home/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'policies',
    loadComponent: () =>
      import('@pages/policies/policies-overview-page/policies-overview-page.component').then(
        (m) => m.PoliciesOverviewPageComponent,
      ),
  },
  {
    path: 'policies/new',
    loadComponent: () =>
      import('@pages/policies/policy-editor-page/policy-editor-page.component').then(
        (m) => m.PolicyEditorPageComponent,
      ),
  },
  {
    path: 'policies/:id',
    loadComponent: () =>
      import('@pages/policies/policy-detail-page/policy-detail-page.component').then(
        (m) => m.PolicyDetailPageComponent,
      ),
  },
  {
    path: 'policies/:id/edit',
    loadComponent: () =>
      import('@pages/policies/policy-editor-page/policy-editor-page.component').then(
        (m) => m.PolicyEditorPageComponent,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('@pages/profile/profile-page.component').then((m) => m.ProfilePageComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
