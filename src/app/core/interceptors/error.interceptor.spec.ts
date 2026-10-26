import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { errorInterceptor } from './error.interceptor';
import { API_URL, seedSession, setupHttp } from '../../../testing/shared-test-setup';

/** Day 3 | AC: expired sessions go to login, forbidden go home | BR: auth endpoints exempt, no redirect loops */
describe('errorInterceptor', () => {
  // HIGH
  it('a 401 logs the user out and redirects to /login with the current URL', async () => {
    // Arrange
    // signed in, viewing /cart
    localStorage.clear();
    seedSession();
    const { http, router } = setupHttp([errorInterceptor], [{ path: 'cart', children: [] }]);
    await router.navigateByUrl('/cart');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const client = TestBed.inject(HttpClient);
    let failure: HttpErrorResponse | undefined;

    // Act
    // a protected call answers 401
    client.get(`${API_URL}/orders`).subscribe({ error: (e: HttpErrorResponse) => (failure = e) });
    http.expectOne(`${API_URL}/orders`).flush('expired', { status: 401, statusText: 'Unauthorized' });

    // Assert
    // session cleared, redirect issued, error rethrown
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/cart' } });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('authUser')).toBeNull();
    expect(failure?.status).toBe(401);
  });

  // HIGH
  it('a 401 from an /api/auth/ endpoint is passed through without logout or redirect', async () => {
    // Arrange
    // signed in; the login call itself fails
    localStorage.clear();
    seedSession();
    const { http, router } = setupHttp([errorInterceptor]);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const client = TestBed.inject(HttpClient);
    let failure: HttpErrorResponse | undefined;

    // Act
    // login answers 401
    client.post(`${API_URL}/auth/login`, {}).subscribe({ error: (e: HttpErrorResponse) => (failure = e) });
    http.expectOne(`${API_URL}/auth/login`).flush('bad', { status: 401, statusText: 'Unauthorized' });

    // Assert
    // untouched session, no navigation, error rethrown
    expect(navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('access-1');
    expect(failure?.status).toBe(401);
  });

  // HIGH
  it('a 401 while already on /login logs out but does not redirect again', async () => {
    // Arrange
    // signed in, already on /login
    localStorage.clear();
    seedSession();
    const { http, router } = setupHttp([errorInterceptor], [{ path: 'login', children: [] }]);
    await router.navigateByUrl('/login');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const client = TestBed.inject(HttpClient);
    let failure: HttpErrorResponse | undefined;

    // Act
    // a protected call answers 401
    client.get(`${API_URL}/orders`).subscribe({ error: (e: HttpErrorResponse) => (failure = e) });
    http.expectOne(`${API_URL}/orders`).flush('expired', { status: 401, statusText: 'Unauthorized' });

    // Assert
    // logged out, but no redirect loop
    expect(navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
    expect(failure?.status).toBe(401);
  });

  // HIGH
  it('a 403 sends the user home and keeps the session', async () => {
    // Arrange
    // signed in, viewing /cart
    localStorage.clear();
    seedSession();
    const { http, router } = setupHttp([errorInterceptor], [{ path: 'cart', children: [] }]);
    await router.navigateByUrl('/cart');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const client = TestBed.inject(HttpClient);
    let failure: HttpErrorResponse | undefined;

    // Act
    // an admin call answers 403
    client.get(`${API_URL}/admin/stats`).subscribe({ error: (e: HttpErrorResponse) => (failure = e) });
    http.expectOne(`${API_URL}/admin/stats`).flush('no', { status: 403, statusText: 'Forbidden' });

    // Assert
    // redirected home, still signed in
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(localStorage.getItem('token')).toBe('access-1');
    expect(failure?.status).toBe(403);
  });

  // HIGH
  it('a 403 while on /login does not redirect', async () => {
    // Arrange
    // on /login
    localStorage.clear();
    const { http, router } = setupHttp([errorInterceptor], [{ path: 'login', children: [] }]);
    await router.navigateByUrl('/login');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const client = TestBed.inject(HttpClient);
    let failure: HttpErrorResponse | undefined;

    // Act
    // a call answers 403
    client.get(`${API_URL}/admin/stats`).subscribe({ error: (e: HttpErrorResponse) => (failure = e) });
    http.expectOne(`${API_URL}/admin/stats`).flush('no', { status: 403, statusText: 'Forbidden' });

    // Assert
    // no navigation, error rethrown
    expect(navigate).not.toHaveBeenCalled();
    expect(failure?.status).toBe(403);
    expect(router.url).toBe('/login');
  });

  // HIGH
  it('other errors are rethrown without side effects', async () => {
    // Arrange
    // signed in
    localStorage.clear();
    seedSession();
    const { http, router } = setupHttp([errorInterceptor]);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const client = TestBed.inject(HttpClient);
    let failure: HttpErrorResponse | undefined;

    // Act
    // a call answers 500
    client.get(`${API_URL}/products`).subscribe({ error: (e: HttpErrorResponse) => (failure = e) });
    http.expectOne(`${API_URL}/products`).flush('boom', { status: 500, statusText: 'Server Error' });

    // Assert
    // error surfaced, nothing else
    expect(failure?.status).toBe(500);
    expect(navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('access-1');
  });

  // HIGH
  it('successful responses pass through untouched', async () => {
    // Arrange
    // signed in
    localStorage.clear();
    seedSession();
    const { http, router } = setupHttp([errorInterceptor]);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const client = TestBed.inject(HttpClient);
    let body: unknown;

    // Act
    // a call answers 200
    client.get(`${API_URL}/products`).subscribe((value) => (body = value));
    http.expectOne(`${API_URL}/products`).flush({ ok: true });

    // Assert
    // body delivered, no side effects
    expect(body).toEqual({ ok: true });
    expect(navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('access-1');
  });
});
