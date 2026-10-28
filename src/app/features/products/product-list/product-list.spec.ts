import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ProductList } from './product-list';
import { ProductPage } from '../../../core/models/product.model';
import { API_URL, product } from '../../../../testing/shared-test-setup';

function productPage(overrides: Partial<ProductPage> = {}, count = 2): ProductPage {
  return {
    content: Array.from({ length: count }, (_, i) => product({ id: i + 1, name: `Item ${i + 1}`, slug: `item-${i + 1}` })),
    page: 0,
    size: 12,
    totalElements: 25,
    totalPages: 3,
    first: true,
    last: false,
    ...overrides,
  };
}

/** Opens /products with the real router so the component reads real query params. */
async function open(url = '/products') {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: 'products', component: ProductList }]),
    ],
  });
  const http = TestBed.inject(HttpTestingController);
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl(url, ProductList);
  const list = () => http.expectOne((r) => r.url === `${API_URL}/products`);
  return { http, harness, component, list, el: harness.routeNativeElement as HTMLElement };
}

/** Unit tests for ProductList. */
describe('ProductList', () => {
  describe('loading', () => {
    it('asks for page 0, 12 items, newest first, and shows skeletons meanwhile', async () => {
      // Arrange
      const { harness, list, el } = await open();

      // Act
      harness.detectChanges();
      const req = list();

      // Assert
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('12');
      expect(req.request.params.get('sort')).toBe('newest');
      expect(el.querySelectorAll('.skeleton').length).toBe(8);
      expect(el.querySelector('[aria-busy="true"]')).not.toBeNull();
    });

    it('reads page, size and sort from the URL (page is 1-based in the URL)', async () => {
      // Arrange
      const { list } = await open('/products?page=2&size=24&sort=price_asc');

      // Act
      const req = list();

      // Assert
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('24');
      expect(req.request.params.get('sort')).toBe('price_asc');
    });

    it('uses the defaults when the URL has invalid values', async () => {
      // Arrange
      const { list } = await open('/products?page=-5&size=999&sort=cheapest');

      // Act
      const req = list();

      // Assert
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('12');
      expect(req.request.params.get('sort')).toBe('newest');
    });
  });

  describe('products', () => {
    it('renders a card per product with the range and a paginator', async () => {
      // Arrange
      const { harness, list, el } = await open();

      // Act
      list().flush(productPage());
      harness.detectChanges();

      // Assert
      expect(el.querySelectorAll('app-product-card').length).toBe(2);
      expect(el.querySelector('.range')?.textContent).toContain('Showing 1-2 of 25');
      expect(el.querySelector('mat-paginator')).not.toBeNull();
      expect(el.querySelectorAll('.skeleton').length).toBe(0);
    });

    it('shows the right range on a later page', async () => {
      // Arrange
      const { harness, list, el } = await open('/products?page=3');

      // Act
      list().flush(productPage({ page: 2, first: false, last: true }, 1));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.range')?.textContent).toContain('Showing 25-25 of 25');
    });
  });

  describe('empty states', () => {
    it('shows No products found and no paginator when the catalog is empty', async () => {
      // Arrange
      const { harness, list, el } = await open();

      // Act
      list().flush(productPage({ totalElements: 0, totalPages: 0, last: true }, 0));
      harness.detectChanges();

      // Assert
      expect(el.textContent).toContain('No products found.');
      expect(el.querySelector('mat-paginator')).toBeNull();
    });

    it('offers a way back when the page is past the last one', async () => {
      // Arrange
      const { harness, http, list, el } = await open('/products?page=99');
      list().flush(productPage({ page: 98, last: true }, 0));
      harness.detectChanges();
      expect(el.textContent).toContain('There are no products on this page.');

      // Act
      const button = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Go to the first page'));
      button?.click();
      await harness.fixture.whenStable();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/products');
      expect(http.expectOne((r) => r.url === `${API_URL}/products`).request.params.get('page')).toBe('0');
    });
  });

  describe('errors', () => {
    it('shows an error and Try again loads the products', async () => {
      // Arrange
      const { harness, list, el } = await open();
      list().flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
      harness.detectChanges();
      expect(el.textContent).toContain('Could not load products.');

      // Act
      const retry = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Try again'));
      retry?.click();
      list().flush(productPage());
      harness.detectChanges();

      // Assert
      expect(el.textContent).not.toContain('Could not load products.');
      expect(el.querySelectorAll('app-product-card').length).toBe(2);
    });
  });

  describe('sorting and paging', () => {
    it('changing the sort updates the URL and goes back to page 1', async () => {
      // Arrange
      const { harness, component, list } = await open('/products?page=2');
      list().flush(productPage({ page: 1, first: false }));

      // Act
      component.onSortChange('price_desc');
      await harness.fixture.whenStable();
      const req = list();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/products?sort=price_desc');
      expect(req.request.params.get('sort')).toBe('price_desc');
      expect(req.request.params.get('page')).toBe('0');
    });

    it('changing the page updates the URL and requests that page', async () => {
      // Arrange
      const { harness, component, list } = await open();
      list().flush(productPage());

      // Act
      component.onPage({ pageIndex: 2, pageSize: 12, length: 25, previousPageIndex: 0 });
      await harness.fixture.whenStable();
      const req = list();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/products?page=3');
      expect(req.request.params.get('page')).toBe('2');
    });

    it('changing the page size goes back to page 1', async () => {
      // Arrange
      const { harness, component, list } = await open('/products?page=2');
      list().flush(productPage({ page: 1, first: false }));

      // Act
      component.onPage({ pageIndex: 1, pageSize: 24, length: 25, previousPageIndex: 1 });
      await harness.fixture.whenStable();
      const req = list();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/products?size=24');
      expect(req.request.params.get('size')).toBe('24');
      expect(req.request.params.get('page')).toBe('0');
    });

    it('the paginator next button moves to the next page', async () => {
      // Arrange
      const { harness, list, el } = await open();
      list().flush(productPage());
      harness.detectChanges();

      // Act
      (el.querySelector('.mat-mdc-paginator-navigation-next') as HTMLButtonElement).click();
      await harness.fixture.whenStable();

      // Assert
      expect(TestBed.inject(Router).url).toBe('/products?page=2');
      expect(list().request.params.get('page')).toBe('1');
    });
  });
});
