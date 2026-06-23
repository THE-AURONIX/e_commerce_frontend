import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const expectedRole = route.data['role'];
  const currentUser = authService.currentUser();

  if (authService.isAuthenticated() && currentUser?.role === expectedRole) {
    return true;
  }

  // Role not authorized, redirect to home
  return router.parseUrl('/');
};
