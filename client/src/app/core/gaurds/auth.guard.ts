import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  var authService = inject(AuthService);
  var router = inject(Router);

  return authService.isUserLogInObservable().pipe(
    map((isUserAuthenticated) => {
      if (isUserAuthenticated === true) {
        return true;
      }

      return router.createUrlTree(['/auth/login']);
    }
    )

  );

};
