import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { EMPTY, Subject, catchError, combineLatest, forkJoin, map, startWith, switchMap, tap } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { ProductPage, ProductSort } from '../../../core/models/product.model';
import { CategoryService } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';
import { ProductCard } from '../../../shared/product-card/product-card';
import {
  DEFAULT_SIZE,
  DEFAULT_SORT,
  ListQuery,
  PAGE_SIZES,
  SORT_OPTIONS,
  parseListQuery,
  toQueryParams,
} from '../../products/product-list/product-list-query';

type LoadState = 'loading' | 'ready' | 'notFound' | 'error';

@Component({
  selector: 'app-category-products',
  imports: [RouterLink, MatButtonModule, MatFormFieldModule, MatPaginatorModule, MatSelectModule, ProductCard],
  templateUrl: './category-products.html',
  styleUrl: './category-products.scss',
})
export class CategoryProducts {
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reload$ = new Subject<void>();

  readonly sortOptions = SORT_OPTIONS;
  readonly pageSizes = PAGE_SIZES;
  readonly skeletons = Array.from({ length: 8 }, (_, i) => i);

  private readonly slug = signal('');
  readonly category = signal<Category | null>(null);
  readonly query = signal<ListQuery>({ page: 1, size: DEFAULT_SIZE, sort: DEFAULT_SORT });
  readonly result = signal<ProductPage | null>(null);
  readonly state = signal<LoadState>('loading');

  /** The URL asks for a page past the last one: the API answers with no products but real totals. */
  readonly pastEnd = computed(() => {
    const page = this.result();
    return page !== null && page.content.length === 0 && page.totalElements > 0;
  });

  /** "1-5 of 5" for the current page. */
  readonly range = computed(() => {
    const page = this.result();
    if (!page || page.content.length === 0) {
      return '';
    }
    const from = page.page * page.size + 1;
    return `${from}-${from + page.content.length - 1} of ${page.totalElements}`;
  });

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap, this.reload$.pipe(startWith(undefined))])
      .pipe(
        map(([params, queryParams]) => ({ slug: params.get('slug') ?? '', query: parseListQuery(queryParams) })),
        tap(({ slug, query }) => {
          if (slug !== this.slug()) {
            this.category.set(null);
            this.result.set(null);
          }
          this.slug.set(slug);
          this.query.set(query);
          this.state.set('loading');
        }),
        switchMap(({ slug, query }) =>
          forkJoin({
            category: this.categoryService.getBySlug(slug),
            page: this.productService.byCategory(slug, { page: query.page - 1, size: query.size, sort: query.sort }),
          }).pipe(
            catchError((error: unknown) => {
              this.state.set(error instanceof HttpErrorResponse && error.status === 404 ? 'notFound' : 'error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ category, page }) => {
        this.category.set(category);
        this.result.set(page);
        this.state.set('ready');
      });
  }

  onSortChange(sort: ProductSort): void {
    this.go({ ...this.query(), sort, page: 1 });
  }

  onPage(event: PageEvent): void {
    const sizeChanged = event.pageSize !== this.query().size;
    this.go({ ...this.query(), size: event.pageSize, page: sizeChanged ? 1 : event.pageIndex + 1 });
  }

  goToFirstPage(): void {
    this.go({ ...this.query(), page: 1 });
  }

  retry(): void {
    this.reload$.next();
  }

  private go(query: ListQuery): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: toQueryParams(query) });
    (document.querySelector('.category-page') as HTMLElement | null)?.scrollIntoView?.();
  }
}
