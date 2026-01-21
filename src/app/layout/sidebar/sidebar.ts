import { Component, OnInit } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';


@Component({
  selector: 'app-sidebar',
  imports: [MenuModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  items: MenuItem[] = [];

  ngOnInit() {
    this.items = [
      { label: 'Dashboard', icon: 'pi pi-home', routerLink: ['/admin/dashboard'] },
      { label: 'Mantenimiento', icon: 'pi pi-wrench', routerLink: ['/admin/mantenimiento'] },
      { label: 'Configuración', icon: 'pi pi-cog', routerLink: ['/settings'] }
    ]
  }
}
