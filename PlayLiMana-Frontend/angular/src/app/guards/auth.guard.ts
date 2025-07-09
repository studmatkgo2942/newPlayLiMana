import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from 'firebase/auth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { map, of, switchMap } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = getAuth();

  return new Promise<boolean>((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve(true);
      } else {
        router.navigate(['/auth']);
        resolve(false);
      }
    });
  });
};
