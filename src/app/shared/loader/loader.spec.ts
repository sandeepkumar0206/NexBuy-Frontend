import { TestBed } from '@angular/core/testing';
import { Loader } from './loader';

/** Unit tests for Loader. */
describe('Loader', () => {
  describe('template', () => {
    it('renders a status region with the default label and a spinner', async () => {
      // Arrange
      // nothing to configure
      TestBed.configureTestingModule({});

      // Act
      // render
      const fixture = TestBed.createComponent(Loader);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // Assert
      // role, label and spinner
      expect(el.querySelector('[role="status"]')).not.toBeNull();
      expect(el.querySelector('.label')?.textContent).toContain('Loading');
      expect(el.querySelector('mat-spinner')).not.toBeNull();
      expect(fixture.componentInstance.diameter).toBe(40);
    });
  });

  describe('inputs', () => {
    it('shows a custom label and diameter', async () => {
      // Arrange
      // loader with inputs
      TestBed.configureTestingModule({});
      const fixture = TestBed.createComponent(Loader);
      fixture.componentRef.setInput('label', 'Fetching products');
      fixture.componentRef.setInput('diameter', 24);

      // Act
      // render
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const spinner = el.querySelector('mat-spinner') as HTMLElement;

      // Assert
      // label and size applied
      expect(el.querySelector('.label')?.textContent).toBe('Fetching products');
      expect(spinner.style.width).toBe('24px');
      expect(spinner.style.height).toBe('24px');
    });
  });
});
