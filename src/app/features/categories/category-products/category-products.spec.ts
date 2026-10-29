import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CategoryProducts } from './category-products';
import { Category } from '../../../core/models/category.model';
import { ProductPage } from '../../../core/models/product.model';
import { API_URL, product } from '../../../../testing/shared-test-setup';

const BOOKS: Category = { id: 1, name: 'Books', slug: 'books', description: 'Read more, worry less.' };

function productPage(overrides: Partial<ProductPage> = {}, count = 2): ProductPage {
  return {
    content: Array.from({ length: count }, (_, i) => product({ id: i + 1, name: `Book ${i + 1}`, slug: `book-${i + 1}` })),
    page: 0,
    size: 12,
    totalElements: 5,
    totalPages: 1,
    first: true,
    last: true,
    ...overrides,
  };
}

/** Opens /categories/:slug with the real router so the component reads real params and query params. */
async function open(url = '/categories/books') {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: 'categories/:slug', component: CategoryProducts }]),
    ],
  });
  const http = TestBed.inject(HttpTestingController);
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl(url, CategoryProducts);
  const el = harness.routeNativeElement as HTMLElement;
  const category = (slug = 'books') => http.expectOne(`${API_URL}/categories/${slug}`);
  const products = (slug = 'books') => http.expectOne((r) => r.url === `${API_URL}/products/category/${slug}`);
  /** Answers both requests the page makes. */
  const respond = (cat: Category | null = BOOKS, page: ProductPage = productPage(), slug = 'books') => {
    category(slug).flush(cat);
    products(slug).flush(page);
    harness.detectChanges();
  };
  return { http, harness, component, el, category, products, respond };
}

/** Unit tests for CategoryProducts. */
describe('CategoryProducts', () => {
  describe('loading', () => {
    it('asks for the category and its first page of products and shows skeletons meanwhile', async () => {
      // Arrange
      const { harness, el, category, products } = await open();

      // Act
      harness.detectChanges();
      const catReq = category();
      const prodReq = products();

      // Assert
      expect(catReq.request.method).toBe('GET');
      expect(prodReq.request.params.get('page')).toBe('0');
      expect(prodReq.request.params.get('size')).toBe('12');
      expect(prodReq.request.params.get('sort')).toBe('newest');
      expect(el.querySelectorAll('.skeleton').length).toBe(8);
      expect(el.querySelector('.skeleton-title')).not.toBeNull();
    });

    it('reads page, size and sort from the URL (page is 1-based in the URL)', async () => {
      // Arrange
      const { category, products } = await open('/categories/books?page=2&size=24&sort=price_asc');

      // Act
      category();
      const req = products();

      // Assert
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('24');
      expect(req.request.params.get('sort')).toBe('price_asc');
    });

    it('uses the defaults when the URL has invalid values', async () => {
      // Arrange
      const { category, products } = await open('/categories/books?page=0&size=7&sort=cheapest');

      // Act
      category();
      const req = products();

      // Assert
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('12');
      expect(req.request.params.get('sort')).toBe('newest');
    });
  });

  describe('category and products', () => {
    it('shows the category name, description and breadcrumb', async () => {
      // Arrange
      const { respond, el } = await open();

      // Act
      respond();

      // Assert
      expect(el.querySelector('h1')?.textContent).toBe('Books');
      expect(el.querySelector('.description')?.textContent).toBe('Read more, worry less.');
      expect(Array.from(el.querySelectorAll('.breadcrumb a')).map((a) => a.getAttribute('href'))).toEqual(['/']);
      expect(el.querySelector('.breadcrumb [aria-current="page"]')?.textContent).toBe('Books');
      expect(el.querySelector('.skeleton-title')).toBeNull();
    });

    it('leaves out the description when the category has none', async () => {
      // Arrange
      const { respond, el } = await open();

      // Act
      respond({ ...BOOKS, description: null });

      // Assert
      expect(el.querySelector('.description')).toBeNull();
    });

    it('renders a card per product with the range and a paginator', async () => {
      // Arrange
      const { respond, el } = await open();

      // Act
      respond();

      // Assert
      expect(el.querySelectorAll('app-product-card').length).toBe(2);
      expect(el.querySelector('.range')?.textContent).toContain('Showing 1-2 of 5');
      expect(el.querySelector('mat-paginator')).not.toBeNull();
      expect(el.querySelectorAll('.skeleton').length).toBe(0);
    });
  });

  describe('empty states', () => {
    it('shows a message and no paginator when the category has no products', async () => {
      // Arrange
      const { respond, el } = await open();

      // Act
      respond(BOOKS, productPage({ totalElements: 0, totalPages: 0 }, 0));

      // Assert
      expect(el.querySelector('h1')?.textContent).toBe('Books');
      expect(el.textContent).toContain('No products in this category yet.');
      expect(el.querySelector('mat-paginator')).toBeNull();
    });

    it('offers a way back when the page is past the last one', async () => {
      // Arrange
      const { harness, respond, el, products, category } = await open('/categories/books?page=9');
      respond(BOOKS, productPage({ page: 8 }, 0));
      expect(el.textContent).toContain('There are no products on this page.');

      // Act
      const button = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Go to the first page'));
      button?.click();
      await harness.fixture.whenStable();
      category();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/categories/books');
      expect(products().request.params.get('page')).toBe('0');
    });
  });

  describe('not found and errors', () => {
    it('shows Category not found with a link to all products when the API answers 404', async () => {
      // Arrange
      const { harness, el, category } = await open('/categories/nope');

      // Act
      category('nope').flush({ message: 'Category not found' }, { status: 404, statusText: 'Not Found' });
      harness.detectChanges();

      // Assert
      expect(el.querySelector('h1')?.textContent).toBe('Category not found');
      expect(el.querySelector('.message a')?.getAttribute('href')).toBe('/products');
    });

    it('shows an error and Try again loads the category', async () => {
      // Arrange
      const { http, harness, el, category, respond } = await open();
      category().flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
      harness.detectChanges();
      http.match((r) => r.url.includes('/products/category/'));
      expect(el.textContent).toContain('Could not load this category.');

      // Act
      const retry = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Try again'));
      retry?.click();
      respond();

      // Assert
      expect(el.textContent).not.toContain('Could not load this category.');
      expect(el.querySelector('h1')?.textContent).toBe('Books');
    });
  });

  describe('sorting and paging', () => {
    it('changing the sort updates the URL, goes back to page 1 and keeps the header', async () => {
      // Arrange
      const { harness, component, el, respond, category, products } = await open('/categories/books?page=2');
      respond(BOOKS, productPage({ page: 1, first: false }));

      // Act
      component.onSortChange('price_desc');
      await harness.fixture.whenStable();
      harness.detectChanges();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/categories/books?sort=price_desc');
      expect(el.querySelector('h1')?.textContent).toBe('Books');
      category();
      const req = products();
      expect(req.request.params.get('sort')).toBe('price_desc');
      expect(req.request.params.get('page')).toBe('0');
    });

    it('changing the page updates the URL and requests that page', async () => {
      // Arrange
      const { harness, component, respond, category, products } = await open();
      respond(BOOKS, productPage({ totalElements: 30, totalPages: 3, last: false }));

      // Act
      component.onPage({ pageIndex: 2, pageSize: 12, length: 30, previousPageIndex: 0 });
      await harness.fixture.whenStable();
      category();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/categories/books?page=3');
      expect(products().request.params.get('page')).toBe('2');
    });

    it('changing the page size goes back to page 1', async () => {
      // Arrange
      const { harness, component, respond, category, products } = await open('/categories/books?page=2');
      respond(BOOKS, productPage({ page: 1, first: false, totalElements: 30, totalPages: 3 }));

      // Act
      component.onPage({ pageIndex: 1, pageSize: 24, length: 30, previousPageIndex: 1 });
      await harness.fixture.whenStable();
      category();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/categories/books?size=24');
      const req = products();
      expect(req.request.params.get('size')).toBe('24');
      expect(req.request.params.get('page')).toBe('0');
    });

    it('the paginator next button moves to the next page', async () => {
      // Arrange
      const { harness, respond, el, category, products } = await open();
      respond(BOOKS, productPage({ totalElements: 30, totalPages: 3, last: false }));

      // Act
      (el.querySelector('.mat-mdc-paginator-navigation-next') as HTMLButtonElement).click();
      await harness.fixture.whenStable();
      category();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/categories/books?page=2');
      expect(products().request.params.get('page')).toBe('1');
    });
  });

  describe('changing category', () => {
    it('loads the next category and clears the old header while it loads', async () => {
      // Arrange
      const { harness, respond, el, category, products } = await open();
      respond();
      expect(el.querySelector('h1')?.textContent).toBe('Books');

      // Act
      await harness.navigateByUrl('/categories/fashion', CategoryProducts);
      harness.detectChanges();

      // Assert
      expect(el.querySelector('h1')).toBeNull();
      expect(el.querySelector('.skeleton-title')).not.toBeNull();
      category('fashion').flush({ id: 2, name: 'Fashion', slug: 'fashion', description: null });
      products('fashion').flush(productPage());
      harness.detectChanges();
      expect(el.querySelector('h1')?.textContent).toBe('Fashion');
    });
  });
});
