import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';

/** Day 1 | AC: footer with copyright | BR: shows the current year */
describe('Footer', () => {
  describe('template', () => {
    // LOW
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
