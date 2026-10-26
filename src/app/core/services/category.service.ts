import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  getBySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${encodeURIComponent(slug)}`);
  }
}
