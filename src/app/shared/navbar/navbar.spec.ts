import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthUser } from '../../core/models/auth.model';
import { Navbar } from './navbar';
import { HttpTestingController } from '@angular/common/http/testing';
import { API_URL, provideAuthStub } from '../../../testing/shared-test-setup';

/** Unit tests for Navbar. */
describe('Navbar', () => {
  describe('template', () => {
    it('shows Login and Register links when signed out', async () => {
      // Arrange
      // stubbed auth with no user
      provideAuthStub();

      // Act
      // render
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // Assert
      // auth links present, no logout
      expect(el.querySelector('a[href="/login"]')?.textContent).toContain('Login');
      expect(el.querySelector('a[href="/register"]')?.textContent).toContain('Register');
      expect(el.textContent).not.toContain('Logout');
      expect(el.querySelector('.brand')?.textContent).toContain('NexBuy');
    });

    it('shows the user\'s name and a Logout button when signed in', async () => {
      // Arrange
      // stubbed auth with a user
      const user: AuthUser = { userId: 7, name: 'Sam', email: 'sam@example.com', role: 'USER' };
      provideAuthStub({ user: signal<AuthUser | null>(user) });

      // Act
      // render
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // Assert
      // name and logout, no auth links
      expect(el.querySelector('.user-name')?.textContent).toContain('Sam');
      expect(el.textContent).toContain('Logout');
      expect(el.querySelector('a[href="/login"]')).toBeNull();
      expect(el.querySelector('a[href="/register"]')).toBeNull();
    });
  });

  describe('categories menu', () => {
    const BOOKS = { id: 1, name: 'Books', slug: 'books', description: null };
    const FASHION = { id: 2, name: 'Fashion', slug: 'fashion', description: null };

    it('shows a Categories button and does not call the API until the menu opens', async () => {
      // Arrange
      provideAuthStub();
      const http = TestBed.inject(HttpTestingController);

      // Act
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();

      // Assert
      expect((fixture.nativeElement as HTMLElement).querySelector('.categories-trigger')?.textContent).toContain('Categories');
      http.expectNone(`${API_URL}/categories`);
    });

    it('opening the menu loads the categories and lists a link for each', async () => {
      // Arrange
      provideAuthStub();
      const http = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();

      // Act
      ((fixture.nativeElement as HTMLElement).querySelector('.categories-trigger') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
      http.expectOne(`${API_URL}/categories`).flush([BOOKS, FASHION]);
      fixture.detectChanges();

      // Assert
      const links = Array.from(document.querySelectorAll('.mat-mdc-menu-panel a')).map((a) => a.getAttribute('href'));
      expect(links).toEqual(['/categories/books', '/categories/fashion']);
    });

    it('loads only once while the categories are already loaded', async () => {
      // Arrange
      provideAuthStub();
      const http = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();
      fixture.componentInstance.loadCategories();
      http.expectOne(`${API_URL}/categories`).flush([BOOKS]);

      // Act
      fixture.componentInstance.loadCategories();

      // Assert
      http.expectNone(`${API_URL}/categories`);
      expect(fixture.componentInstance.categories()).toEqual([BOOKS]);
    });

    it('tries again after a failure the next time the menu opens', async () => {
      // Arrange
      provideAuthStub();
      const http = TestBed.inject(HttpTestingController);
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();
      fixture.componentInstance.loadCategories();
      http.expectOne(`${API_URL}/categories`).flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
      expect(fixture.componentInstance.categoriesState()).toBe('error');

      // Act
      fixture.componentInstance.loadCategories();
      http.expectOne(`${API_URL}/categories`).flush([BOOKS]);

      // Assert
      expect(fixture.componentInstance.categoriesState()).toBe('ready');
      expect(fixture.componentInstance.categories()).toEqual([BOOKS]);
    });
  });

  describe('logout', () => {
    it('logout signs out and navigates home', async () => {
      // Arrange
      // stubbed auth with a user and a navigation spy
      const user: AuthUser = { userId: 7, name: 'Sam', email: 'sam@example.com', role: 'USER' };
      const { auth, router } = provideAuthStub({ user: signal<AuthUser | null>(user) });
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const fixture = TestBed.createComponent(Navbar);
      fixture.detectChanges();

      // Act
      // click Logout
      const button = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) => b.textContent?.includes('Logout'));
      button?.click();

      // Assert
      // auth.logout then navigate to /
      expect(button).toBeDefined();
      expect(auth.logout).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
