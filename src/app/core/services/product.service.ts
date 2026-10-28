import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductPage, ProductQuery } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  list(query: ProductQuery = {}): Observable<ProductPage> {
    return this.http.get<ProductPage>(this.apiUrl, { params: this.toParams({ ...query }) });
  }

  getFeatured(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/featured`);
  }

  getBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/slug/${encodeURIComponent(slug)}`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  search(q: string, query: Pick<ProductQuery, 'page' | 'size' | 'sort'> = {}): Observable<ProductPage> {
    return this.http.get<ProductPage>(`${this.apiUrl}/search`, {
      params: this.toParams({ q, ...query }),
    });
  }

  byCategory(
    slug: string,
    query: Pick<ProductQuery, 'page' | 'size' | 'sort'> = {},
  ): Observable<ProductPage> {
    return this.http.get<ProductPage>(`${this.apiUrl}/category/${encodeURIComponent(slug)}`, {
      params: this.toParams({ ...query }),
    });
  }

  /** Builds query params and leaves out anything that is undefined, null, or blank. */
  private toParams(values: Record<string, string | number | undefined | null>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
