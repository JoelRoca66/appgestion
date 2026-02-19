import { inject } from '@angular/core';
import { Router, CanActivateFn, CanActivateChildFn } from '@angular/router';
import { StorageService } from '../core/services/storage.service';

function getStoredUser(): any | null {
  const storage = inject(StorageService);
  const raw = storage.getItem('currentUser');

  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    return user;
  } catch {
    return null;
  }
}

function isAdminRole(rol: any): boolean {
  return rol === true;
}

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const user = getStoredUser();

  if (user) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn & CanActivateChildFn = (route, state) => {
  const router = inject(Router);
  const user = getStoredUser();


  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (isAdminRole(user.rol)) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const userGuard: CanActivateFn & CanActivateChildFn = (route, state) => {
  const router = inject(Router);
  const user = getStoredUser();


  if (!user) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const user = getStoredUser();

  if (!user) {
    return true;
  }

  const targetRoute = isAdminRole(user.rol) ? '/admin/home' : '/user/home';
  return router.createUrlTree([targetRoute]);
};