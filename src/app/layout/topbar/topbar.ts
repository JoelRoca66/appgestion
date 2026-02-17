import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { JornadaService } from '../../core/services/jornada.service';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../core/services/storage.service';


@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [ToolbarModule, ButtonModule, TooltipModule, BadgeModule, CommonModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  noValidadasCount = 0;
  constructor(private storage: StorageService) {}

  admin = false;

  private router = inject(Router);
  private jornadaService = inject(JornadaService);
  private cdr = inject(ChangeDetectorRef);


  logout(): void {
    try {
      sessionStorage.removeItem('currentUser');
      localStorage.removeItem('currentUser');
    } finally {
      this.router.navigateByUrl('/login');
    }
  }

  ngOnInit() {
    this.admin = this.isAdmin();
    this.cargarCount();
  }

  cargarCount() {
    this.jornadaService.countNoValidadas().subscribe({
      next: count => {
        this.noValidadasCount = count;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('ERROR COMPLETO:', err);
        console.error('STATUS:', err.status);
        console.error('BODY:', err.error);
      }
    });

  }


  irAValidaciones() {
    this.router.navigate(['/admin', 'jornadas', 'no-validadas']);
  }

  private isAdmin(): boolean {
    const raw = this.storage.getItem('currentUser');
    if (!raw) return false;

    try {
      const user = JSON.parse(raw);
      return user?.rol === true;
    } catch {
      return false;
    }
  }
}