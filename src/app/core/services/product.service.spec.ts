import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { environment } from '../../../environments/environment';

describe('Catalog services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends only the query params that are set', () => {
    TestBed.inject(ProductService)
      .list({ page: 1, sort: 'price_asc', minPrice: 10, categoryId: undefined })
      .subscribe();

    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/products`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('sort')).toBe('price_asc');
    expect(req.request.params.get('minPrice')).toBe('10');
    expect(req.request.params.has('categoryId')).toBe(false);
    expect(req.request.params.has('size')).toBe(false);
    req.flush({});
  });

  it('keeps a page number of 0', () => {
    TestBed.inject(ProductService).list({ page: 0 }).subscribe();

    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/products`);
    expect(req.request.params.get('page')).toBe('0');
    req.flush({});
  });

  it('calls the search, category, and detail endpoints', () => {
    const service = TestBed.inject(ProductService);

    service.search('head phones', { size: 5 }).subscribe();
    const search = http.expectOne((r) => r.url === `${environment.apiUrl}/products/search`);
    expect(search.request.params.get('q')).toBe('head phones');
    expect(search.request.params.get('size')).toBe('5');
    search.flush({});

    service.byCategory('home-kitchen').subscribe();
    http.expectOne(`${environment.apiUrl}/products/category/home-kitchen`).flush({});

    service.getById(7).subscribe();
    http.expectOne(`${environment.apiUrl}/products/7`).flush({});
  });

  it('loads categories', () => {
    const service = TestBed.inject(CategoryService);

    service.list().subscribe();
    http.expectOne(`${environment.apiUrl}/categories`).flush([]);

    service.getBySlug('books').subscribe();
    http.expectOne(`${environment.apiUrl}/categories/books`).flush({});
  });
});
