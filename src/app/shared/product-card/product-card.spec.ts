import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductCard } from './product-card';
import { product } from '../../../testing/shared-test-setup';

/** Day 4 | AC: product card shows price, sale, stock | BR: placeholder image, strike-through when discounted */
describe('ProductCard', () => {
  describe('imageUrl', () => {
    // MEDIUM
    it('imageUrl is the first image when one exists', async () => {
      // Arrange
      // product with two images
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(ProductCard);
      fixture.componentRef.setInput('product', product({ images: ['a.jpg', 'b.jpg'] }));

      // Act
      // render
      fixture.detectChanges();
      const img = (fixture.nativeElement as HTMLElement).querySelector('img');

      // Assert
      // first image used
      expect(fixture.componentInstance.imageUrl).toBe('a.jpg');
      expect(img?.getAttribute('src')).toBe('a.jpg');
      expect(img?.getAttribute('alt')).toBe('Yoga Mat Pro');
    });

    // MEDIUM
    it('imageUrl falls back to the placeholder when there are no images', async () => {
      // Arrange
      // product without images
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(ProductCard);
      fixture.componentRef.setInput('product', product({ images: [] }));

      // Act
      // render
      fixture.detectChanges();
      const img = (fixture.nativeElement as HTMLElement).querySelector('img');

      // Assert
      // placeholder used
      expect(fixture.componentInstance.imageUrl).toContain('placehold.co');
      expect(img?.getAttribute('src')).toContain('placehold.co');
      expect(fixture.componentInstance.imageUrl).toBe('https://placehold.co/400x300?text=NexBuy');
    });
  });

  describe('onSale', () => {
    // MEDIUM
    it('onSale is true only when the discounted price is lower', async () => {
      // Arrange
      // card on a discounted product
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(ProductCard);
      fixture.componentRef.setInput('product', product({ price: 30, discountedPrice: 24 }));
      fixture.detectChanges();

      // Act
      // read, then switch to an undiscounted product
      const discounted = fixture.componentInstance.onSale;
      fixture.componentRef.setInput('product', product({ price: 30, discountedPrice: 30 }));
      fixture.detectChanges();
      const regular = fixture.componentInstance.onSale;

      // Assert
      // flag follows the price
      expect(discounted).toBe(true);
      expect(regular).toBe(false);
      expect((fixture.nativeElement as HTMLElement).querySelector('.sale-price')).toBeNull();
    });
  });

  describe('template', () => {
    // MEDIUM
    it('a discounted product shows the sale price and a struck-through old price', async () => {
      // Arrange
      // discounted product
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(ProductCard);
      fixture.componentRef.setInput('product', product({ price: 30, discountedPrice: 24 }));

      // Act
      // render
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // Assert
      // both prices
      expect(el.querySelector('.sale-price')?.textContent).toContain('$24.00');
      expect(el.querySelector('.old-price')?.textContent).toContain('$30.00');
      expect(el.querySelector('.out-of-stock')).toBeNull();
    });

    // MEDIUM
    it('an out-of-stock product shows the notice', async () => {
      // Arrange
      // product with no stock
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(ProductCard);
      fixture.componentRef.setInput('product', product({ inStock: false, stock: 0 }));

      // Act
      // render
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // Assert
      // notice shown, regular price shown
      expect(el.querySelector('.out-of-stock')?.textContent).toContain('Out of stock');
      expect(el.querySelector('.sale-price')).toBeNull();
      expect(el.textContent).toContain('$30.00');
    });

    // MEDIUM
    it('the View link points at the product slug', async () => {
      // Arrange
      // product with slug
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(ProductCard);
      fixture.componentRef.setInput('product', product({ slug: 'yoga-mat-pro' }));

      // Act
      // render
      fixture.detectChanges();
      const link = (fixture.nativeElement as HTMLElement).querySelector('a');

      // Assert
      // href and label
      expect(link?.getAttribute('href')).toBe('/products/yoga-mat-pro');
      expect(link?.textContent).toContain('View');
      expect(link?.getAttribute('target')).toBeNull();
    });
  });

  describe('onImageError', () => {
    // MEDIUM
    it('onImageError swaps a broken image for the placeholder', async () => {
      // Arrange
      // card and a broken image element
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(ProductCard);
      fixture.componentRef.setInput('product', product());
      fixture.detectChanges();
      const img = document.createElement('img');
      img.src = 'https://example.com/broken.jpg';

      // Act
      // fire the handler
      fixture.componentInstance.onImageError({ target: img } as unknown as Event);

      // Assert
      // placeholder applied
      expect(img.src).toBe('https://placehold.co/400x300?text=NexBuy');
      expect(img.src).not.toContain('broken');
      expect(fixture.componentInstance.imageUrl).toBe('https://example.com/mat.jpg');
    });
  });
});
