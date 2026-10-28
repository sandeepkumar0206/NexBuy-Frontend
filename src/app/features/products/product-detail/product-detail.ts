import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, Subject, catchError, combineLatest, map, startWith, switchMap, tap } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { Loader } from '../../../shared/loader/loader';
import { PLACEHOLDER_IMAGE } from '../../../shared/product-card/product-card';

/** Most units a customer can pick at once, even when more are in stock. */
export const MAX_QUANTITY = 10;

type LoadState = 'loading' | 'ready' | 'notFound' | 'error';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe, RouterLink, MatButtonModule, MatIconModule, Loader],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly reload$ = new Subject<void>();

  readonly product = signal<Product | null>(null);
  readonly state = signal<LoadState>('loading');
  readonly selectedIndex = signal(0);
  readonly quantity = signal(1);

  /** The product images, or one placeholder when it has none. */
  readonly images = computed(() => {
    const images = this.product()?.images ?? [];
    return images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  });
  readonly mainImage = computed(() => this.images()[this.selectedIndex()] ?? this.images()[0]);
  readonly hasGallery = computed(() => this.images().length > 1);

  readonly onSale = computed(() => {
    const product = this.product();
    return product !== null && product.discountedPrice < product.price;
  });

  /** Quantity cannot go above the stock or the per-order limit. */
  readonly maxQuantity = computed(() => Math.min(this.product()?.stock ?? 0, MAX_QUANTITY));

  constructor() {
    combineLatest([this.route.paramMap, this.reload$.pipe(startWith(undefined))])
      .pipe(
        map(([params]) => params.get('slug') ?? ''),
        tap(() => this.state.set('loading')),
        switchMap((slug) =>
          this.productService.getBySlug(slug).pipe(
            catchError((error: unknown) => {
              this.state.set(error instanceof HttpErrorResponse && error.status === 404 ? 'notFound' : 'error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((product) => {
        this.product.set(product);
        this.selectedIndex.set(0);
        this.quantity.set(1);
        this.state.set('ready');
      });
  }

  selectImage(index: number): void {
    this.selectedIndex.set(index);
  }

  increase(): void {
    this.quantity.update((value) => Math.min(value + 1, this.maxQuantity()));
  }

  decrease(): void {
    this.quantity.update((value) => Math.max(value - 1, 1));
  }

  retry(): void {
    this.reload$.next();
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
  }
}
