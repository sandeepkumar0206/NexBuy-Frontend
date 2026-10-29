import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, Routes, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthResponse, AuthUser } from '../app/core/models/auth.model';
import { Product } from '../app/core/models/product.model';
import { AuthService } from '../app/core/services/auth.service';
import { environment } from '../environments/environment';

/** Shared fixtures for spec files. No shared mutable state. */
export const API_URL = environment.apiUrl;

export function authResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    tokenType: 'Bearer',
    userId: 7,
    name: 'Sam',
    email: 'sam@example.com',
    role: 'USER',
    ...overrides,
  };
}

/** Seeds a signed-in session in localStorage (what AuthService persists). */
export function seedSession(role: 'USER' | 'ADMIN' = 'USER'): void {
  localStorage.setItem('token', 'access-1');
  localStorage.setItem('refreshToken', 'refresh-1');
  localStorage.setItem(
    'authUser',
    JSON.stringify({ userId: 7, name: 'Sam', email: 'sam@example.com', role }),
  );
}

/** AuthService wired to the HTTP testing backend. Clears storage unless keepStorage is set. */
export function setupAuthService(keepStorage = false): { auth: AuthService; http: HttpTestingController } {
  if (!keepStorage) {
    localStorage.clear();
  }
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
}

/** HttpClient (with optional interceptors) plus Router, backed by the HTTP testing controller. */
export function setupHttp(
  interceptors: HttpInterceptorFn[] = [],
  routes: Routes = [],
  query: Record<string, string> | null = null,
): { http: HttpTestingController; router: Router } {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors(interceptors)),
      provideHttpClientTesting(),
      provideRouter(routes),
      ...(query
        ? [{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } }]
        : []),
    ],
  });
  return { http: TestBed.inject(HttpTestingController), router: TestBed.inject(Router) };
}

/** Product fixture; override only what a test cares about. */
export function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Yoga Mat Pro',
    slug: 'yoga-mat-pro',
    price: 30,
    discountedPrice: 30,
    stock: 5,
    inStock: true,
    description: null,
    images: ['https://example.com/mat.jpg'],
    category: null,
    ...overrides,
  };
}

/**
 * Replaces AuthService with a stub (the component's direct dependency), fixes the route's
 * query params, and stubs Router.navigateByUrl. Returns the stub and the navigation spy.
 */
export function provideAuthStub(
  overrides: Record<string, unknown> = {},
  query: Record<string, string> = {},
): { auth: any; navigateByUrl: ReturnType<typeof vi.spyOn>; router: Router } {
  const auth: any = {
    isLoggedIn: vi.fn(() => false),
    login: vi.fn(() => of(authResponse())),
    register: vi.fn(() => of(authResponse())),
    logout: vi.fn(),
    user: signal<AuthUser | null>(null),
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthService, useValue: auth },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
    ],
  });
  const router = TestBed.inject(Router);
  const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  return { auth, navigateByUrl, router };
}
