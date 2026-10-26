import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { Login } from './login';
import { authResponse, provideAuthStub } from '../../../../testing/shared-test-setup';

/** Day 3 | AC: login form with validation, safe redirects, API errors | BR: only local returnUrl, never loop to /login or /register */
describe('Login', () => {
  describe('form', () => {
    // CRITICAL
    it('the form starts invalid with required errors', async () => {
      // Arrange
      // stubbed auth, signed out
      provideAuthStub();

      // Act
      // render the page
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      // Assert
      // invalid and required
      expect(component.form.valid).toBe(false);
      expect(component.form.controls.email.hasError('required')).toBe(true);
      expect(component.form.controls.password.hasError('required')).toBe(true);
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Log in');
    });

    // CRITICAL
    it('the email control rejects a malformed address', async () => {
      // Arrange
      // stubbed auth
      provideAuthStub();
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      // Act
      // type a bad email and a password
      component.form.setValue({ email: 'not-an-email', password: 'secret1' });

      // Assert
      // email format error only
      expect(component.form.controls.email.hasError('email')).toBe(true);
      expect(component.form.controls.password.valid).toBe(true);
      expect(component.form.valid).toBe(false);
    });
  });

  describe('submit', () => {
    // CRITICAL
    it('submit with an invalid form touches the fields and does not call the API', async () => {
      // Arrange
      // stubbed auth and an empty form
      const { auth, navigateByUrl } = provideAuthStub();
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      // Act
      // submit
      component.submit();

      // Assert
      // no call, fields touched, nothing in flight
      expect(auth.login).not.toHaveBeenCalled();
      expect(component.form.controls.email.touched).toBe(true);
      expect(component.submitting()).toBe(false);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    // CRITICAL
    it('submit logs in with the form values and goes home when there is no returnUrl', async () => {
      // Arrange
      // stubbed auth that succeeds
      const { auth, navigateByUrl } = provideAuthStub();
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.setValue({ email: 'sam@example.com', password: 'secret1' });

      // Act
      // submit
      component.submit();

      // Assert
      // credentials sent, navigated to /
      expect(auth.login).toHaveBeenCalledTimes(1);
      expect(auth.login).toHaveBeenCalledWith({ email: 'sam@example.com', password: 'secret1' });
      expect(navigateByUrl).toHaveBeenCalledWith('/');
      expect(component.errorMessage()).toBe('');
    });

    // CRITICAL
    it('submit returns to a safe local returnUrl after login', async () => {
      // Arrange
      // stubbed auth that succeeds, returnUrl=/cart
      const { navigateByUrl } = provideAuthStub({}, { returnUrl: '/cart' });
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.setValue({ email: 'sam@example.com', password: 'secret1' });

      // Act
      // submit
      component.submit();

      // Assert
      // went to /cart
      expect(navigateByUrl).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledWith('/cart');
      expect(navigateByUrl).not.toHaveBeenCalledWith('/');
    });

    // CRITICAL
    it('submit ignores an external returnUrl', async () => {
      // Arrange
      // stubbed auth that succeeds, returnUrl=//evil.example.com
      const { navigateByUrl } = provideAuthStub({}, { returnUrl: '//evil.example.com' });
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.setValue({ email: 'sam@example.com', password: 'secret1' });

      // Act
      // submit
      component.submit();

      // Assert
      // fell back to /
      expect(navigateByUrl).toHaveBeenCalledWith('/');
      expect(navigateByUrl).not.toHaveBeenCalledWith('//evil.example.com');
      expect(navigateByUrl).toHaveBeenCalledTimes(1);
    });

    // CRITICAL
    it('submit does not send the user back to /login or /register', async () => {
      // Arrange
      // stubbed auth that succeeds, returnUrl=/login
      const { navigateByUrl } = provideAuthStub({}, { returnUrl: '/login?x=1' });
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.setValue({ email: 'sam@example.com', password: 'secret1' });

      // Act
      // submit
      component.submit();

      // Assert
      // fell back to /
      expect(navigateByUrl).toHaveBeenCalledWith('/');
      expect(navigateByUrl).not.toHaveBeenCalledWith('/login?x=1');
      expect(navigateByUrl).toHaveBeenCalledTimes(1);
    });

    // CRITICAL
    it('submit shows the server\'s message and re-enables the button on failure', async () => {
      // Arrange
      // stubbed auth that rejects
      const { navigateByUrl } = provideAuthStub({
        login: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Invalid email or password' } }))),
      });
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.setValue({ email: 'sam@example.com', password: 'wrong' });

      // Act
      // submit and re-render
      component.submit();
      fixture.detectChanges();

      // Assert
      // message shown, not submitting, no navigation
      expect(component.errorMessage()).toBe('Invalid email or password');
      expect(component.submitting()).toBe(false);
      expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Invalid email or password');
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    // CRITICAL
    it('submit falls back to a generic message when the error has no text', async () => {
      // Arrange
      // stubbed auth that rejects with an empty body
      provideAuthStub({
        login: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 500, error: {} }))),
      });
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.setValue({ email: 'sam@example.com', password: 'secret1' });

      // Act
      // submit
      component.submit();

      // Assert
      // fallback text
      expect(component.errorMessage()).toBe('Login failed. Check your email and password.');
      expect(component.submitting()).toBe(false);
      expect(component.form.valid).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    // CRITICAL
    it('ngOnInit redirects an already signed-in user to the returnUrl', async () => {
      // Arrange
      // stubbed auth reporting signed in, returnUrl=/cart
      const { navigateByUrl } = provideAuthStub({ isLoggedIn: vi.fn(() => true) }, { returnUrl: '/cart' });

      // Act
      // render the page
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();

      // Assert
      // redirected
      expect(navigateByUrl).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledWith('/cart');
      expect(fixture.componentInstance.submitting()).toBe(false);
    });

    // CRITICAL
    it('ngOnInit leaves a signed-out visitor on the page', async () => {
      // Arrange
      // stubbed auth reporting signed out
      const { navigateByUrl, auth } = provideAuthStub();

      // Act
      // render the page
      const fixture = TestBed.createComponent(Login);
      fixture.detectChanges();

      // Assert
      // no redirect
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(auth.isLoggedIn).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance.errorMessage()).toBe('');
    });
  });
});
