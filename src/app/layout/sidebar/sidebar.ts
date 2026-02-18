import { Component, OnInit } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { StorageService } from '../../core/services/storage.service';


@Component({
  selector: 'app-sidebar',
  imports: [MenuModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  constructor(private storage: StorageService) {}
  items: MenuItem[] = [];

  ngOnInit() {
    const isAdmin = this.isAdmin();

    this.items = [
      { label: 'Home', icon: 'pi pi-home', routerLink: ['/user/home'] },
      { label: 'Proyectos', icon: 'pi pi-graduation-cap', routerLink: ['/user/proyectos'] },
      { label: 'Tareas', icon: 'pi pi-list', routerLink: ['/user/tareas'] },
    ];

    if (isAdmin) {
      this.items.push(
        { label: 'Mantenimiento', icon: 'pi pi-wrench', routerLink: ['/admin/mantenimiento'] },
        { label: 'Configuración', icon: 'pi pi-cog', routerLink: ['/admin/config'] }
      );
    } else {
      this.items.push({ label: 'Configuración', icon: 'pi pi-cog', routerLink: ['/user/config'] });
    }
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
