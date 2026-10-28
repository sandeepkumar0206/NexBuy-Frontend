import { TestBed } from '@angular/core/testing';
import { ProductService } from './product.service';
import { API_URL, product, setupHttp } from '../../../testing/shared-test-setup';

/** Unit tests for ProductService. */
describe('ProductService', () => {
  describe('list', () => {
    it('list sends only the query params that are set', async () => {
      // Arrange
      // service on the HTTP testing backend
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);

      // Act
      // list with page, sort, minPrice and an undefined categoryId
      service.list({ page: 1, sort: 'price_asc', minPrice: 10, categoryId: undefined }).subscribe();
      const req = http.expectOne((r) => r.url === `${API_URL}/products`);
      req.flush({});

      // Assert
      // only set values
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('sort')).toBe('price_asc');
      expect(req.request.params.get('minPrice')).toBe('10');
      expect(req.request.params.has('categoryId')).toBe(false);
      expect(req.request.params.has('size')).toBe(false);
    });

    it('list keeps zero values', async () => {
      // Arrange
      // service
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);

      // Act
      // list with page 0 and minPrice 0
      service.list({ page: 0, minPrice: 0 }).subscribe();
      const req = http.expectOne((r) => r.url === `${API_URL}/products`);
      req.flush({});

      // Assert
      // zeros are sent
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('minPrice')).toBe('0');
      expect(req.request.params.keys().length).toBe(2);
    });

    it('list without a query sends no params', async () => {
      // Arrange
      // service
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);

      // Act
      // list with defaults
      service.list().subscribe();
      const req = http.expectOne((r) => r.url === `${API_URL}/products`);
      req.flush({});

      // Assert
      // bare URL
      expect(req.request.params.keys().length).toBe(0);
      expect(req.request.urlWithParams).toBe(`${API_URL}/products`);
      expect(req.request.method).toBe('GET');
    });
  });

  describe('getFeatured', () => {
    it('getFeatured requests the featured products and returns the list', async () => {
      // Arrange
      // service on the HTTP testing backend
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);
      let result: unknown;

      // Act
      // call and answer with two products
      service.getFeatured().subscribe((products) => (result = products));
      const req = http.expectOne(`${API_URL}/products/featured`);
      req.flush([product({ id: 1 }), product({ id: 2 })]);

      // Assert
      // GET with the list passed through
      expect(req.request.method).toBe('GET');
      expect(result).toEqual([product({ id: 1 }), product({ id: 2 })]);
    });
  });

  describe('getBySlug', () => {
    it('getBySlug requests the product by slug', async () => {
      // Arrange
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);
      let body: unknown;

      // Act
      service.getBySlug('yoga-mat-pro').subscribe((value) => (body = value));
      const req = http.expectOne(`${API_URL}/products/slug/yoga-mat-pro`);
      req.flush(product());

      // Assert
      expect(req.request.method).toBe('GET');
      expect(body).toEqual(product());
    });

    it('getBySlug encodes the slug', async () => {
      // Arrange
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);

      // Act
      service.getBySlug('a b/c').subscribe();

      // Assert
      http.expectOne(`${API_URL}/products/slug/a%20b%2Fc`).flush({});
    });
  });

  describe('getById', () => {
    it('getById requests the product by id', async () => {
      // Arrange
      // service
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);
      let body: unknown;

      // Act
      // fetch 7
      service.getById(7).subscribe((value) => (body = value));
      const req = http.expectOne(`${API_URL}/products/7`);
      req.flush({ id: 7 });

      // Assert
      // URL, verb and response
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      expect(body).toEqual({ id: 7 });
    });
  });

  describe('search', () => {
    it('search sends q with the paging options', async () => {
      // Arrange
      // service
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);

      // Act
      // search with spaces and a page size
      service.search('head phones', { size: 5 }).subscribe();
      const req = http.expectOne((r) => r.url === `${API_URL}/products/search`);
      req.flush({});

      // Assert
      // q and size set
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('q')).toBe('head phones');
      expect(req.request.params.get('size')).toBe('5');
      expect(req.request.params.has('page')).toBe(false);
    });

    it('search omits a blank q', async () => {
      // Arrange
      // service
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);

      // Act
      // search with an empty string
      service.search('').subscribe();
      const req = http.expectOne((r) => r.url === `${API_URL}/products/search`);
      req.flush({});

      // Assert
      // q not sent
      expect(req.request.params.has('q')).toBe(false);
      expect(req.request.params.keys().length).toBe(0);
      expect(req.request.method).toBe('GET');
    });
  });

  describe('byCategory', () => {
    it('byCategory encodes the slug and forwards the sort', async () => {
      // Arrange
      // service
      const { http } = setupHttp();
      const service = TestBed.inject(ProductService);

      // Act
      // category with characters that need encoding
      service.byCategory('home & kitchen', { sort: 'name' }).subscribe();
      const req = http.expectOne((r) => r.url === `${API_URL}/products/category/home%20%26%20kitchen`);
      req.flush({});

      // Assert
      // encoded path and sort param
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('sort')).toBe('name');
      expect(req.request.params.keys().length).toBe(1);
    });
  });
});
