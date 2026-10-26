import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (error.status === 0) {
    return 'Cannot reach the server. Start the backend and try again.';
  }

  const body = error.error;
  if (body && typeof body === 'object') {
    const errors = (body as { errors?: unknown }).errors;
    if (errors && typeof errors === 'object') {
      const first = Object.values(errors).find((value) => typeof value === 'string');
      if (typeof first === 'string' && first.trim()) {
        return first;
      }
    }
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}
