import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error';

/** Day 3 | AC: friendly API error text in forms | BR: first field error, else message, else fallback */
describe('apiErrorMessage', () => {
  // MEDIUM
  it('returns the fallback for errors that are not HTTP errors', async () => {
    // Arrange
    // three non-HTTP values
    const values: unknown[] = [new Error('boom'), 'text', null];

    // Act
    // map each
    const results = values.map((value) => apiErrorMessage(value, 'Fallback'));

    // Assert
    // all fallback
    expect(results).toEqual(['Fallback', 'Fallback', 'Fallback']);
    expect(results.length).toBe(3);
    expect(new Set(results).size).toBe(1);
  });

  // MEDIUM
  it('reports an unreachable server for status 0', async () => {
    // Arrange
    // network failure
    const error = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });

    // Act
    // map
    const message = apiErrorMessage(error, 'Fallback');

    // Assert
    // dedicated text
    expect(message).toBe('Cannot reach the server. Start the backend and try again.');
    expect(message).not.toBe('Fallback');
    expect(message).toContain('backend');
  });

  // MEDIUM
  it('returns the first string from the validation errors map', async () => {
    // Arrange
    // validation body with two field errors and a general message
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Validation failed', errors: { email: 'must be a well-formed email address', password: 'size must be between 6 and 100' } },
    });

    // Act
    // map
    const message = apiErrorMessage(error, 'Fallback');

    // Assert
    // first field error wins over the general message
    expect(message).toBe('must be a well-formed email address');
    expect(message).not.toBe('Validation failed');
    expect(message).not.toBe('Fallback');
  });

  // MEDIUM
  it('falls through to the message when the errors map has no usable text', async () => {
    // Arrange
    // errors map with a number and a blank string
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Validation failed', errors: { count: 5, name: '   ' } },
    });

    // Act
    // map
    const message = apiErrorMessage(error, 'Fallback');

    // Assert
    // message used
    expect(message).toBe('Validation failed');
    expect(message).not.toBe('Fallback');
    expect(message.trim().length).toBeGreaterThan(0);
  });

  // MEDIUM
  it('returns the message field when there is no errors map', async () => {
    // Arrange
    // plain message body
    const error = new HttpErrorResponse({ status: 400, error: { status: 400, message: 'Email is already registered' } });

    // Act
    // map
    const message = apiErrorMessage(error, 'Fallback');

    // Assert
    // server text
    expect(message).toBe('Email is already registered');
    expect(message).not.toBe('Fallback');
    expect(error.status).toBe(400);
  });

  // MEDIUM
  it('returns the fallback when the body has no usable text', async () => {
    // Arrange
    // string body, empty object, blank message
    const text = new HttpErrorResponse({ status: 500, error: 'Server exploded' });
    const empty = new HttpErrorResponse({ status: 500, error: {} });
    const blank = new HttpErrorResponse({ status: 500, error: { message: '  ' } });

    // Act
    // map each
    const results = [text, empty, blank].map((e) => apiErrorMessage(e, 'Fallback'));

    // Assert
    // all fallback
    expect(results).toEqual(['Fallback', 'Fallback', 'Fallback']);
    expect(results.length).toBe(3);
    expect(results.every((r) => r === 'Fallback')).toBe(true);
  });
});
