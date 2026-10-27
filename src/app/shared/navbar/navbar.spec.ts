import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthUser } from '../../core/models/auth.model';
import { Navbar } from './navbar';
import { provideAuthStub } from '../../../testing/shared-test-setup';

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
