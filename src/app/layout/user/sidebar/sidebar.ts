import { User } from './../../../core/models/user.model';
import {Component, OnInit } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-sidebar-user',
  imports: [MenuModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar_User implements OnInit{ 
    items: MenuItem[] = [];

  ngOnInit() {
    this.items = [
      { label: 'Home', icon: 'pi pi-home', routerLink: ['/user/home'] },
      { label: 'Proyectos', icon: 'pi pi-graduation-cap', routerLink: ['/user/proyectos'] },
      { label: 'Tareas', icon: 'pi pi-wrench', routerLink: ['/user/tareas'] },
      { label: 'Configuración', icon: 'pi pi-cog', routerLink: ['/user/config'] }
    ]
  }
}
