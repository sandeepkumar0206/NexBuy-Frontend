import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ProductDetail } from './product-detail';
import { API_URL, product } from '../../../../testing/shared-test-setup';

const CATEGORY = { id: 1, name: 'Sports', slug: 'sports', description: null };
const SLUG_URL = `${API_URL}/products/slug/yoga-mat-pro`;

/** Opens /products/:slug with the real router so the component reads the real route param. */
async function open(slug = 'yoga-mat-pro') {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: 'products/:slug', component: ProductDetail }]),
    ],
  });
  const http = TestBed.inject(HttpTestingController);
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl(`/products/${slug}`, ProductDetail);
  const el = harness.routeNativeElement as HTMLElement;
  return { http, harness, component, el };
}

function button(el: HTMLElement, label: string): HTMLButtonElement {
  return el.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
}

/** Unit tests for ProductDetail. */
describe('ProductDetail', () => {
  describe('loading', () => {
    it('asks for the product by the slug in the URL and shows a loader meanwhile', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      harness.detectChanges();

      // Assert
      expect(el.querySelector('app-loader')).not.toBeNull();
      expect(http.expectOne(SLUG_URL).request.method).toBe('GET');
    });
  });

  describe('product info', () => {
    it('shows the name, price, description and the In stock badge', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product({ price: 30, discountedPrice: 30, description: 'Grippy and thick.' }));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('h1')?.textContent).toBe('Yoga Mat Pro');
      expect(el.querySelector('.price')?.textContent).toContain('$30.00');
      expect(el.querySelector('.old-price')).toBeNull();
      expect(el.querySelector('.description')?.textContent).toBe('Grippy and thick.');
      expect(el.querySelector('.badge.in-stock')?.textContent).toContain('In stock');
    });

    it('shows the sale price with the old price when discounted', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product({ price: 30, discountedPrice: 24 }));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.sale-price')?.textContent).toContain('$24.00');
      expect(el.querySelector('.old-price')?.textContent).toContain('$30.00');
    });

    it('leaves out the description when there is none', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product({ description: null }));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.description')).toBeNull();
    });
  });

  describe('breadcrumb', () => {
    it('shows Home, the category link and the product name', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product({ category: CATEGORY }));
      harness.detectChanges();

      // Assert
      const links = Array.from(el.querySelectorAll('.breadcrumb a')).map((a) => a.getAttribute('href'));
      expect(links).toEqual(['/', '/categories/sports']);
      expect(el.querySelector('.breadcrumb [aria-current="page"]')?.textContent).toBe('Yoga Mat Pro');
    });

    it('shows only Home and the name when the product has no category', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product({ category: null }));
      harness.detectChanges();

      // Assert
      expect(el.querySelectorAll('.breadcrumb a').length).toBe(1);
    });
  });

  describe('gallery', () => {
    it('shows the first image large and one thumbnail per image', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product({ images: ['a.jpg', 'b.jpg', 'c.jpg'] }));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.main-image')?.getAttribute('src')).toBe('a.jpg');
      expect(el.querySelectorAll('.thumb').length).toBe(3);
      expect(el.querySelector('.thumb.selected')).toBe(el.querySelectorAll('.thumb')[0]);
    });

    it('clicking a thumbnail changes the large image', async () => {
      // Arrange
      const { http, harness, el } = await open();
      http.expectOne(SLUG_URL).flush(product({ images: ['a.jpg', 'b.jpg'] }));
      harness.detectChanges();

      // Act
      (el.querySelectorAll('.thumb')[1] as HTMLButtonElement).click();
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.main-image')?.getAttribute('src')).toBe('b.jpg');
      expect(el.querySelector('.thumb.selected')).toBe(el.querySelectorAll('.thumb')[1]);
    });

    it('hides the thumbnails when there is only one image', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product({ images: ['a.jpg'] }));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.thumbs')).toBeNull();
    });

    it('shows a placeholder when the product has no images', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product({ images: [] }));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.main-image')?.getAttribute('src')).toContain('placehold.co');
      expect(el.querySelector('.thumbs')).toBeNull();
    });
  });

  describe('quantity and cart', () => {
    it('starts at 1 and cannot go below 1', async () => {
      // Arrange
      const { http, harness, el } = await open();
      http.expectOne(SLUG_URL).flush(product({ stock: 5 }));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.quantity-value')?.textContent).toBe('1');
      expect(button(el, 'Decrease quantity').disabled).toBe(true);
    });

    it('increase goes up to the stock and then stops', async () => {
      // Arrange
      const { http, harness, el } = await open();
      http.expectOne(SLUG_URL).flush(product({ stock: 3 }));
      harness.detectChanges();

      // Act
      for (let i = 0; i < 5; i++) {
        button(el, 'Increase quantity').click();
        harness.detectChanges();
      }

      // Assert
      expect(el.querySelector('.quantity-value')?.textContent).toBe('3');
      expect(button(el, 'Increase quantity').disabled).toBe(true);
    });

    it('increase stops at 10 even when more are in stock', async () => {
      // Arrange
      const { http, harness, el } = await open();
      http.expectOne(SLUG_URL).flush(product({ stock: 50 }));
      harness.detectChanges();

      // Act
      for (let i = 0; i < 15; i++) {
        button(el, 'Increase quantity').click();
        harness.detectChanges();
      }

      // Assert
      expect(el.querySelector('.quantity-value')?.textContent).toBe('10');
    });

    it('decrease goes back down', async () => {
      // Arrange
      const { http, harness, el } = await open();
      http.expectOne(SLUG_URL).flush(product({ stock: 5 }));
      harness.detectChanges();
      button(el, 'Increase quantity').click();
      button(el, 'Increase quantity').click();
      harness.detectChanges();

      // Act
      button(el, 'Decrease quantity').click();
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.quantity-value')?.textContent).toBe('2');
    });

    it('shows Out of stock and disables the quantity buttons', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product({ stock: 0, inStock: false }));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('.badge.out-of-stock')?.textContent).toContain('Out of stock');
      expect(button(el, 'Increase quantity').disabled).toBe(true);
      expect(button(el, 'Decrease quantity').disabled).toBe(true);
    });

    it('keeps Add to cart disabled and says the cart is coming soon', async () => {
      // Arrange
      const { http, harness, el } = await open();

      // Act
      http.expectOne(SLUG_URL).flush(product());
      harness.detectChanges();

      // Assert
      expect((el.querySelector('.add-to-cart') as HTMLButtonElement).disabled).toBe(true);
      expect(el.querySelector('.hint')?.textContent).toContain('coming soon');
    });
  });

  describe('not found and errors', () => {
    it('shows Product not found with a link back to the products when the API answers 404', async () => {
      // Arrange
      const { http, harness, el } = await open('nope');

      // Act
      http.expectOne(`${API_URL}/products/slug/nope`).flush({ message: 'Product not found' }, { status: 404, statusText: 'Not Found' });
      harness.detectChanges();

      // Assert
      expect(el.querySelector('h1')?.textContent).toBe('Product not found');
      expect(el.querySelector('.message a')?.getAttribute('href')).toBe('/products');
    });

    it('shows an error and Try again loads the product', async () => {
      // Arrange
      const { http, harness, el } = await open();
      http.expectOne(SLUG_URL).flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
      harness.detectChanges();
      expect(el.textContent).toContain('Could not load this product.');

      // Act
      const retry = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Try again'));
      retry?.click();
      http.expectOne(SLUG_URL).flush(product());
      harness.detectChanges();

      // Assert
      expect(el.textContent).not.toContain('Could not load this product.');
      expect(el.querySelector('h1')?.textContent).toBe('Yoga Mat Pro');
    });
  });

  describe('changing product', () => {
    it('loads the next product when the slug changes and resets the quantity and image', async () => {
      // Arrange
      const { http, harness, el } = await open();
      http.expectOne(SLUG_URL).flush(product({ stock: 5, images: ['a.jpg', 'b.jpg'] }));
      harness.detectChanges();
      button(el, 'Increase quantity').click();
      (el.querySelectorAll('.thumb')[1] as HTMLButtonElement).click();
      harness.detectChanges();

      // Act
      await harness.navigateByUrl('/products/desk-lamp', ProductDetail);
      http.expectOne(`${API_URL}/products/slug/desk-lamp`).flush(product({ name: 'Desk Lamp', slug: 'desk-lamp', stock: 5, images: ['x.jpg', 'y.jpg'] }));
      harness.detectChanges();

      // Assert
      expect(el.querySelector('h1')?.textContent).toBe('Desk Lamp');
      expect(el.querySelector('.quantity-value')?.textContent).toBe('1');
      expect(el.querySelector('.main-image')?.getAttribute('src')).toBe('x.jpg');
    });
  });
});
