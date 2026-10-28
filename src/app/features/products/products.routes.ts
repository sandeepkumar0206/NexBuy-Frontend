import { Routes } from '@angular/router';

/** Loaded on demand the first time someone opens /products. */
export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: ':slug',
    loadComponent: () => import('./product-detail/product-detail').then((m) => m.ProductDetail),
  },
];
