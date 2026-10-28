import { TestBed } from '@angular/core/testing';
import { CategoryService } from './category.service';
import { API_URL, setupHttp } from '../../../testing/shared-test-setup';

/** Unit tests for CategoryService. */
describe('CategoryService', () => {
  describe('list', () => {
    it('list requests every category', async () => {
      // Arrange
      // service
      const { http } = setupHttp();
      const service = TestBed.inject(CategoryService);
      let body: unknown;

      // Act
      // list
      service.list().subscribe((value) => (body = value));
      const req = http.expectOne(`${API_URL}/categories`);
      req.flush([{ id: 1, name: 'Books', slug: 'books', description: null }]);

      // Assert
      // URL, verb and response
      expect(req.request.method).toBe('GET');
      expect(Array.isArray(body)).toBe(true);
      expect((body as { slug: string }[])[0].slug).toBe('books');
      http.verify();
    });
  });

  describe('getBySlug', () => {
    it('getBySlug encodes the slug', async () => {
      // Arrange
      // service
      const { http } = setupHttp();
      const service = TestBed.inject(CategoryService);
      let body: unknown;

      // Act
      // fetch a slug needing encoding
      service.getBySlug('home & kitchen').subscribe((value) => (body = value));
      const req = http.expectOne(`${API_URL}/categories/home%20%26%20kitchen`);
      req.flush({ id: 3, slug: 'home & kitchen' });

      // Assert
      // encoded URL and response
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(`${API_URL}/categories/home%20%26%20kitchen`);
      expect(body).toEqual({ id: 3, slug: 'home & kitchen' });
    });
  });
});
