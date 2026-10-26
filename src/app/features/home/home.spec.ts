import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

/** Day 1 | AC: landing page | BR: welcome text and Browse products link */
describe('Home', () => {
  describe('template', () => {
    // LOW
    it('renders the welcome heading and a link to the products page', async () => {
      // Arrange
      // router for the link
      TestBed.configureTestingModule({ providers: [provideRouter([])] });

      // Act
      // render
      const fixture = TestBed.createComponent(Home);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // Assert
      // heading and link
      expect(el.querySelector('h1')?.textContent).toBe('Welcome to NexBuy');
      expect(el.querySelector('a')?.getAttribute('href')).toBe('/products');
      expect(el.querySelector('a')?.textContent).toContain('Browse products');
    });
  });
});
