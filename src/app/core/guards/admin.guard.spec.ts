import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { seedSession, setupHttp } from '../../../testing/shared-test-setup';

/** Day 3 | AC: protect admin routes | BR: login first, then ADMIN role required */
describe('adminGuard', () => {
  // HIGH
  it('allows an admin through', async () => {
    // Arrange
    // stored admin session
    localStorage.clear();
    seedSession('ADMIN');
    setupHttp();

    // Act
    // run the guard
    const result = TestBed.runInInjectionContext(() => adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    // Assert
    // plain true
    expect(result).toBe(true);
    expect(result instanceof UrlTree).toBe(false);
    expect(localStorage.getItem('authUser')).toContain('ADMIN');
  });

  // HIGH
  it('sends a signed-out visitor to /login with the current URL', async () => {
    // Arrange
    // signed out, currently on /admin
    localStorage.clear();
    const { router } = setupHttp([], [{ path: 'admin', children: [] }]);
    await router.navigateByUrl('/admin');

    // Act
    // run the guard
    const result = TestBed.runInInjectionContext(() => adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    // Assert
    // UrlTree to /login?returnUrl=/admin
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fadmin');
    expect(router.url).toBe('/admin');
  });

  // HIGH
  it('sends a signed-in non-admin home', async () => {
    // Arrange
    // regular user session
    localStorage.clear();
    seedSession('USER');
    const { router } = setupHttp();

    // Act
    // run the guard
    const result = TestBed.runInInjectionContext(() => adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    // Assert
    // UrlTree to /
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
    expect(localStorage.getItem('token')).toBe('access-1');
  });
});
