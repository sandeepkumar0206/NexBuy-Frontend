import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { API_URL, setupHttp } from '../../../testing/shared-test-setup';

/** Unit tests for ApiService. */
describe('ApiService', () => {
  describe('get', () => {
    it('get prefixes the path with the API base URL and returns the body', async () => {
      // Arrange
      // service on the HTTP testing backend
      const { http } = setupHttp();
      const api = TestBed.inject(ApiService);
      let body: unknown;

      // Act
      // GET /health
      api.get<{ ok: boolean }>('/health').subscribe((value) => (body = value));
      const req = http.expectOne(`${API_URL}/health`);
      req.flush({ ok: true });

      // Assert
      // URL, verb and response
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(`${API_URL}/health`);
      expect(body).toEqual({ ok: true });
      http.verify();
    });
  });

  describe('baseUrl', () => {
    it('baseUrl mirrors the environment API URL', async () => {
      // Arrange
      // service
      setupHttp();
      const api = TestBed.inject(ApiService);

      // Act
      // read
      const base = api.baseUrl;

      // Assert
      // same value
      expect(base).toBe(API_URL);
      expect(base.startsWith('http')).toBe(true);
      expect(base.endsWith('/')).toBe(false);
    });
  });
});
