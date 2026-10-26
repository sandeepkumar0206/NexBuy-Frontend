import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductCard } from './product-card';
import { Product } from '../../core/models/product.model';

const baseProduct: Product = {
  id: 1,
  name: 'Yoga Mat Pro',
  slug: 'yoga-mat-pro',
  price: 30,
  discountedPrice: 30,
  stock: 5,
  inStock: true,
  description: null,
  images: ['https://example.com/mat.jpg'],
  category: null,
};

function render(product: Product): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(ProductCard);
  fixture.componentRef.setInput('product', product);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ProductCard', () => {
  it('shows the name, price, and first image', () => {
    const el = render(baseProduct);

    expect(el.textContent).toContain('Yoga Mat Pro');
    expect(el.textContent).toContain('$30.00');
    expect(el.querySelector('img')?.getAttribute('src')).toBe('https://example.com/mat.jpg');
    expect(el.querySelector('.old-price')).toBeNull();
    expect(el.querySelector('.out-of-stock')).toBeNull();
  });

  it('shows the sale price with the old price struck through', () => {
    const el = render({ ...baseProduct, discountedPrice: 24 });

    expect(el.querySelector('.sale-price')?.textContent).toContain('$24.00');
    expect(el.querySelector('.old-price')?.textContent).toContain('$30.00');
  });

  it('flags out-of-stock products and falls back to a placeholder image', () => {
    const el = render({ ...baseProduct, inStock: false, stock: 0, images: [] });

    expect(el.querySelector('.out-of-stock')?.textContent).toContain('Out of stock');
    expect(el.querySelector('img')?.getAttribute('src')).toContain('placehold.co');
  });
});
