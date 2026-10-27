import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { Loader } from '../../shared/loader/loader';
import { ProductCard } from '../../shared/product-card/product-card';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatCardModule, ProductCard, Loader],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  protected readonly auth = inject(AuthService);

  readonly featured = signal<Product[]>([]);
  readonly featuredState = signal<LoadState>('loading');
  readonly categories = signal<Category[]>([]);
  readonly categoriesState = signal<LoadState>('loading');

  constructor() {
    this.loadFeatured();
    this.loadCategories();
  }

  loadFeatured(): void {
    this.featuredState.set('loading');
    this.productService.getFeatured().subscribe({
      next: (products) => {
        this.featured.set(products);
        this.featuredState.set('ready');
      },
      error: () => this.featuredState.set('error'),
    });
  }

  loadCategories(): void {
    this.categoriesState.set('loading');
    this.categoryService.list().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.categoriesState.set('ready');
      },
      error: () => this.categoriesState.set('error'),
    });
  }
}
