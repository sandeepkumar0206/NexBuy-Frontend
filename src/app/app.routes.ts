import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes').then((m) => m.PRODUCT_ROUTES),
  },
  {
    path: 'categories',
    loadChildren: () => import('./features/categories/categories.routes').then((m) => m.CATEGORY_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
