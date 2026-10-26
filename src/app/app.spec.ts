import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { App } from './app';

/** Day 1 | AC: app shell | BR: navbar, routed content, footer */
describe('App', () => {
  describe('creation', () => {
    it('should create the app', () => {
      // Arrange
      TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });

      // Act
      const fixture = TestBed.createComponent(App);

      // Assert
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render NexBuy brand', async () => {
      // Arrange
      TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });

      // Act
      const fixture = TestBed.createComponent(App);
      await fixture.whenStable();

      // Assert
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.brand')?.textContent).toContain('NexBuy');
    });
  });

  describe('template', () => {
    // MEDIUM
    it('renders the navbar, the router outlet and the footer in the shell', async () => {
      // Arrange
      // shell with router and HTTP (for the real AuthService)
      localStorage.clear();
      TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });

      // Act
      // render
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // Assert
      // the three regions in order inside the shell
      expect(el.querySelector('.app-shell')).not.toBeNull();
      expect(el.querySelector('app-navbar')).not.toBeNull();
      expect(el.querySelector('main.content router-outlet')).not.toBeNull();
      expect(el.querySelector('app-footer')).not.toBeNull();
    });
  });
});
