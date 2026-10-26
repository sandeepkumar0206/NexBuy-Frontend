import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { appConfig } from './app.config';
import { API_URL, seedSession } from '../testing/shared-test-setup';

/** Day 3 | AC: interceptors registered app-wide | BR: auth interceptor then error interceptor */
describe('appConfig', () => {
  // HIGH
  it('the configured HttpClient attaches the Bearer token', async () => {
    // Arrange
    // real app providers with the HTTP backend swapped for the testing one
    localStorage.clear();
    seedSession();
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);

    // Act
    // send a request through the app's HttpClient
    TestBed.inject(HttpClient).get(`${API_URL}/products`).subscribe();
    const req = http.expectOne(`${API_URL}/products`);
    req.flush({});

    // Assert
    // the interceptor ran
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    expect(req.request.method).toBe('GET');
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  // HIGH
  it('the configured HttpClient logs out on a 401', async () => {
    // Arrange
    // real app providers with a stubbed navigation
    localStorage.clear();
    seedSession();
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    let failure: HttpErrorResponse | undefined;

    // Act
    // a protected call answers 401
    TestBed.inject(HttpClient).get(`${API_URL}/orders`).subscribe({ error: (e: HttpErrorResponse) => (failure = e) });
    http.expectOne(`${API_URL}/orders`).flush('expired', { status: 401, statusText: 'Unauthorized' });

    // Assert
    // the error interceptor ran
    expect(localStorage.getItem('token')).toBeNull();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(failure?.status).toBe(401);
  });
});
