import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { Register } from './register';
import { provideAuthStub } from '../../../../testing/shared-test-setup';

/** Unit tests for Register. */
describe('Register', () => {
  describe('form', () => {
    it('the form starts invalid and flags each field\'s own rule', async () => {
      // Arrange
      // stubbed auth
      provideAuthStub();
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      // Act
      // type short name, bad email, short password
      component.form.patchValue({ name: 'A', email: 'bad', password: '123' });

      // Assert
      // per-field errors
      expect(component.form.valid).toBe(false);
      expect(component.form.controls.name.hasError('minlength')).toBe(true);
      expect(component.form.controls.email.hasError('email')).toBe(true);
      expect(component.form.controls.password.hasError('minlength')).toBe(true);
    });

    it('a confirmation that differs from the password is flagged', async () => {
      // Arrange
      // stubbed auth
      provideAuthStub();
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      // Act
      // type different values
      component.form.patchValue({ password: 'secret1', confirmPassword: 'different' });

      // Assert
      // mismatch error
      expect(component.form.controls.confirmPassword.hasError('passwordMismatch')).toBe(true);
      expect(component.form.valid).toBe(false);
      expect(component.form.controls.password.hasError('passwordMismatch')).toBe(false);
    });

    it('a matching confirmation has no mismatch error', async () => {
      // Arrange
      // stubbed auth
      provideAuthStub();
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      // Act
      // type equal values
      component.form.patchValue({ password: 'secret1', confirmPassword: 'secret1' });

      // Assert
      // no error
      expect(component.form.controls.confirmPassword.hasError('passwordMismatch')).toBe(false);
      expect(component.form.controls.confirmPassword.valid).toBe(true);
      expect(component.form.controls.password.valid).toBe(true);
    });
  });

  describe('constructor', () => {
    it('changing the password re-checks the confirmation', async () => {
      // Arrange
      // matching passwords
      provideAuthStub();
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.patchValue({ password: 'secret1', confirmPassword: 'secret1' });

      // Act
      // change only the password
      component.form.controls.password.setValue('changed1');

      // Assert
      // confirmation now mismatches
      expect(component.form.controls.confirmPassword.hasError('passwordMismatch')).toBe(true);
      expect(component.form.controls.confirmPassword.value).toBe('secret1');
      expect(component.form.valid).toBe(false);
    });
  });

  describe('submit', () => {
    it('submit with an invalid form touches the fields and does not call the API', async () => {
      // Arrange
      // stubbed auth and an empty form
      const { auth, navigateByUrl } = provideAuthStub();
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      // Act
      // submit
      component.submit();

      // Assert
      // no call, fields touched
      expect(auth.register).not.toHaveBeenCalled();
      expect(component.form.controls.name.touched).toBe(true);
      expect(component.submitting()).toBe(false);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('submit registers without the confirmation field and goes home', async () => {
      // Arrange
      // stubbed auth that succeeds and a valid form
      const { auth, navigateByUrl } = provideAuthStub();
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.setValue({ name: 'Sam', email: 'sam@example.com', password: 'secret1', confirmPassword: 'secret1' });

      // Act
      // submit
      component.submit();

      // Assert
      // payload without confirmPassword, navigated to /
      expect(auth.register).toHaveBeenCalledTimes(1);
      expect(auth.register).toHaveBeenCalledWith({ name: 'Sam', email: 'sam@example.com', password: 'secret1' });
      expect(navigateByUrl).toHaveBeenCalledWith('/');
      expect(component.errorMessage()).toBe('');
    });

    it('submit shows the server\'s message and re-enables the button on failure', async () => {
      // Arrange
      // stubbed auth that rejects with a duplicate email
      const { navigateByUrl } = provideAuthStub({
        register: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Email is already registered' } }))),
      });
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.setValue({ name: 'Sam', email: 'sam@example.com', password: 'secret1', confirmPassword: 'secret1' });

      // Act
      // submit
      component.submit();

      // Assert
      // message shown, not submitting, no navigation
      expect(component.errorMessage()).toBe('Email is already registered');
      expect(component.submitting()).toBe(false);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('submit falls back to a generic message when the error has no text', async () => {
      // Arrange
      // stubbed auth that rejects with an empty body
      provideAuthStub({
        register: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 500, error: {} }))),
      });
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.form.setValue({ name: 'Sam', email: 'sam@example.com', password: 'secret1', confirmPassword: 'secret1' });

      // Act
      // submit
      component.submit();

      // Assert
      // fallback text
      expect(component.errorMessage()).toBe('Registration failed. Please try again.');
      expect(component.submitting()).toBe(false);
      expect(component.form.valid).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('ngOnInit redirects an already signed-in user home', async () => {
      // Arrange
      // stubbed auth reporting signed in
      const { navigateByUrl } = provideAuthStub({ isLoggedIn: vi.fn(() => true) });

      // Act
      // render the page
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();

      // Assert
      // redirected to /
      expect(navigateByUrl).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledWith('/');
      expect(fixture.componentInstance.submitting()).toBe(false);
    });

    it('ngOnInit leaves a signed-out visitor on the page', async () => {
      // Arrange
      // stubbed auth reporting signed out
      const { navigateByUrl, auth } = provideAuthStub();

      // Act
      // render the page
      const fixture = TestBed.createComponent(Register);
      fixture.detectChanges();

      // Assert
      // no redirect
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(auth.isLoggedIn).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance.errorMessage()).toBe('');
    });
  });
});
