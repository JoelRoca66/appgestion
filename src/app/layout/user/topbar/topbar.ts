import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-topbar-user',
  imports: [ToolbarModule, ButtonModule, TooltipModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar_User { 
    private router = inject(Router);
    logout(): void {
    try {
      sessionStorage.removeItem('currentUser');
      localStorage.removeItem('currentUser');
    } finally {
      this.router.navigateByUrl('/login');
    }
  }
}
