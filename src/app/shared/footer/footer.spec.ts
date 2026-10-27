import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';

/** Unit tests for Footer. */
describe('Footer', () => {
  describe('template', () => {
    it('shows the copyright with the current year and nav links', async () => {
      // Arrange
      // pin the clock to 2031
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2031-06-15T12:00:00Z'));
      TestBed.configureTestingModule({ providers: [provideRouter([])] });

      // Act
      // render
      const fixture = TestBed.createComponent(Footer);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      vi.useRealTimers();

      // Assert
      // year and links
      expect(fixture.componentInstance.year).toBe(2031);
      expect(el.textContent).toContain('2031 NexBuy');
      expect(el.querySelector('a[href="/"]')?.textContent).toContain('Home');
      expect(el.querySelector('a[href="/products"]')?.textContent).toContain('Products');
    });
  });
});
