import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

  if (userStr) {
    return true; 
  } else {
    router.navigate(['/login']);
    return false;
  }
};

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

  if (userStr) {
    const user = JSON.parse(userStr);
    
    if (user.rol === true) {
      return true; 
    } else {
      router.navigate(['/portal/home']); 
      return false;
    }
  }

  router.navigate(['/login']);
  return false;
};