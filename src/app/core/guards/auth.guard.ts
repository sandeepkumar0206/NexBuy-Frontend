import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/** Placeholder – wire to auth service on Day 2+ */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  if (token) {
    return true;
  }
  return router.createUrlTree(['/auth/login']);
};
