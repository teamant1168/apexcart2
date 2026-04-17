import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../Services/auth.service';

export const adminAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isUserLogInObservable().pipe(
    map((isAuthenticated) => {
      if (isAuthenticated && authService.isAdminUser()) {
        return true;
      }

      if (isAuthenticated) {
        return router.createUrlTree(['/']);
      }

      return router.createUrlTree(['/admin/login']);
    })
  );
};
