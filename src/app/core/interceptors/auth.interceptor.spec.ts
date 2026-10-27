import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { seedSession, setupHttp } from '../../../testing/shared-test-setup';

/** Unit tests for authInterceptor. */
describe('authInterceptor', () => {
  it('adds a Bearer Authorization header when a token is stored', async () => {
    // Arrange
    // stored session and an interceptor-enabled client
    localStorage.clear();
    seedSession();
    const { http } = setupHttp([authInterceptor]);
    const client = TestBed.inject(HttpClient);

    // Act
    // send a request
    client.get('/api/ping').subscribe();
    const req = http.expectOne('/api/ping');
    req.flush({});

    // Assert
    // header present
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    expect(req.request.method).toBe('GET');
    expect(req.request.url).toBe('/api/ping');
    http.verify();
  });

  it('sends the request unchanged when no token is stored', async () => {
    // Arrange
    // signed out and an interceptor-enabled client
    localStorage.clear();
    const { http } = setupHttp([authInterceptor]);
    const client = TestBed.inject(HttpClient);

    // Act
    // send a request
    client.get('/api/ping').subscribe();
    const req = http.expectOne('/api/ping');
    req.flush({});

    // Assert
    // no header added
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.keys().length).toBe(0);
  });

  it('keeps headers the caller already set', async () => {
    // Arrange
    // stored session and a request with its own header
    localStorage.clear();
    seedSession();
    const { http } = setupHttp([authInterceptor]);
    const client = TestBed.inject(HttpClient);

    // Act
    // send a request with X-Trace
    client.get('/api/ping', { headers: { 'X-Trace': 'abc' } }).subscribe();
    const req = http.expectOne('/api/ping');
    req.flush({});

    // Assert
    // both headers present
    expect(req.request.headers.get('X-Trace')).toBe('abc');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    expect(req.request.headers.keys().length).toBe(2);
  });
});
