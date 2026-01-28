import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getItem(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      // Devuelve la primera que tenga valor
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch (e) {
      console.error('Error reading from storage:', e);
      return null;
    }
  }

  setItem(key: string, value: string, remember = false): void {
    if (!this.isBrowser) return;

    try {
      if (remember) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Error writing to storage:', e);
    }
  }

  removeItem(key: string): void {
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing from storage:', e);
    }
  }
}