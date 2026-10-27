import { TestBed } from '@angular/core/testing';
import { Home } from './home';
import { API_URL, product, seedSession, setupHttp } from '../../../testing/shared-test-setup';

const CATEGORIES = [
  { id: 1, name: 'Books', slug: 'books', description: 'Read more' },
  { id: 2, name: 'Fashion', slug: 'fashion', description: null },
];

function render() {
  localStorage.clear();
  const { http } = setupHttp();
  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { http, fixture, el };
}

/** Unit tests for Home. */
describe('Home', () => {
  describe('hero', () => {
    it('shows the heading and a Shop now link to the products page', async () => {
      // Arrange
      const { fixture, el } = render();

      // Act
      fixture.detectChanges();

      // Assert
      expect(el.querySelector('h1')?.textContent).toBe('Welcome to NexBuy');
      const shop = el.querySelector('.hero a[href="/products"]');
      expect(shop?.textContent).toContain('Shop now');
    });

    it('shows Create account when signed out', async () => {
      // Arrange
      const { el } = render();

      // Assert
      expect(el.querySelector('.hero a[href="/register"]')).not.toBeNull();
    });

    it('hides Create account when signed in', async () => {
      // Arrange
      seedSession();
      setupHttp();
      const fixture = TestBed.createComponent(Home);

      // Act
      fixture.detectChanges();

      // Assert
      expect((fixture.nativeElement as HTMLElement).querySelector('.hero a[href="/register"]')).toBeNull();
      localStorage.clear();
    });
  });

  describe('loading', () => {
    it('shows a loader in both sections until the data arrives', async () => {
      // Arrange
      const { http, el } = render();

      // Assert
      expect(el.querySelectorAll('app-loader').length).toBe(2);
      http.expectOne(`${API_URL}/products/featured`);
      http.expectOne(`${API_URL}/categories`);
    });
  });

  describe('featured products', () => {
    it('renders a product card for each featured product', async () => {
      // Arrange
      const { http, fixture, el } = render();

      // Act
      http.expectOne(`${API_URL}/products/featured`).flush([product({ id: 1 }), product({ id: 2, name: 'Desk Lamp' })]);
      http.expectOne(`${API_URL}/categories`).flush([]);
      fixture.detectChanges();

      // Assert
      expect(el.querySelectorAll('app-product-card').length).toBe(2);
      expect(el.textContent).toContain('Desk Lamp');
    });

    it('shows an empty message when there are no featured products', async () => {
      // Arrange
      const { http, fixture, el } = render();

      // Act
      http.expectOne(`${API_URL}/products/featured`).flush([]);
      http.expectOne(`${API_URL}/categories`).flush([]);
      fixture.detectChanges();

      // Assert
      expect(el.querySelectorAll('app-product-card').length).toBe(0);
      expect(el.textContent).toContain('No featured products right now');
    });

    it('shows an error with Try again, and Try again loads the products', async () => {
      // Arrange
      const { http, fixture, el } = render();
      http.expectOne(`${API_URL}/products/featured`).error(new ProgressEvent('error'), { status: 0 });
      http.expectOne(`${API_URL}/categories`).flush([]);
      fixture.detectChanges();
      expect(el.textContent).toContain('Could not load products');

      // Act
      const retry = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Try again'));
      retry?.click();
      http.expectOne(`${API_URL}/products/featured`).flush([product()]);
      fixture.detectChanges();

      // Assert
      expect(el.textContent).not.toContain('Could not load products');
      expect(el.querySelectorAll('app-product-card').length).toBe(1);
    });
  });

  describe('categories', () => {
    it('renders a card linking to each category page', async () => {
      // Arrange
      const { http, fixture, el } = render();

      // Act
      http.expectOne(`${API_URL}/products/featured`).flush([]);
      http.expectOne(`${API_URL}/categories`).flush(CATEGORIES);
      fixture.detectChanges();

      // Assert
      const links = Array.from(el.querySelectorAll('a.category-link')).map((a) => a.getAttribute('href'));
      expect(links).toEqual(['/categories/books', '/categories/fashion']);
      expect(el.textContent).toContain('Read more');
    });

    it('shows an empty message when there are no categories', async () => {
      // Arrange
      const { http, fixture, el } = render();

      // Act
      http.expectOne(`${API_URL}/products/featured`).flush([]);
      http.expectOne(`${API_URL}/categories`).flush([]);
      fixture.detectChanges();

      // Assert
      expect(el.textContent).toContain('No categories yet');
    });

    it('shows an error when categories fail, and the products still load', async () => {
      // Arrange
      const { http, fixture, el } = render();

      // Act
      http.expectOne(`${API_URL}/products/featured`).flush([product()]);
      http.expectOne(`${API_URL}/categories`).flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      // Assert
      expect(el.textContent).toContain('Could not load categories');
      expect(el.querySelectorAll('app-product-card').length).toBe(1);
    });
  });

  describe('promo', () => {
    it('shows the promo banner with a link to the full catalog', async () => {
      // Arrange
      const { http, el } = render();
      http.match(() => true);

      // Assert
      expect(el.querySelector('.promo a')?.getAttribute('href')).toBe('/products');
    });
  });
});