import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { seedSession, setupHttp } from '../../../testing/shared-test-setup';

/** Unit tests for authGuard. */
describe('authGuard', () => {
  it('allows navigation when the user is signed in', async () => {
    // Arrange
    // stored session
    localStorage.clear();
    seedSession();
    setupHttp();

    // Act
    // run the guard
    const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    // Assert
    // plain true, not a redirect
    expect(result).toBe(true);
    expect(result instanceof UrlTree).toBe(false);
    expect(localStorage.getItem('token')).toBe('access-1');
  });

  it('redirects a signed-out user to /login carrying the current URL', async () => {
    // Arrange
    // signed out, currently on /cart
    localStorage.clear();
    const { router } = setupHttp([], [{ path: 'cart', children: [] }]);
    await router.navigateByUrl('/cart');

    // Act
    // run the guard
    const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    // Assert
    // UrlTree to /login?returnUrl=/cart
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fcart');
    expect(router.url).toBe('/cart');
  });
});
