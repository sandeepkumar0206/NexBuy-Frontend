import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Category } from '../../core/models/category.model';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';

type CategoriesState = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);

  readonly categories = signal<Category[]>([]);
  readonly categoriesState = signal<CategoriesState>('idle');

  /** Called when the Categories menu opens. Loads once, and tries again after a failure. */
  loadCategories(): void {
    if (this.categoriesState() === 'loading' || this.categoriesState() === 'ready') {
      return;
    }
    this.categoriesState.set('loading');
    this.categoryService.list().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.categoriesState.set('ready');
      },
      error: () => this.categoriesState.set('error'),
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
