import { Routes } from '@angular/router';

/** Loaded on demand the first time someone opens a category. */
export const CATEGORY_ROUTES: Routes = [
  {
    path: ':slug',
    loadComponent: () => import('./category-products/category-products').then((m) => m.CategoryProducts),
  },
];
