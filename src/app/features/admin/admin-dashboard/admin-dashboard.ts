import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, TableModule, TagModule, CardModule, ButtonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  users: User[] = [
    {
      id: 1, usuario: 'jroca', isAdmin: true,
      worker: { id: 1, nombre: 'Joel', apellido: 'Roca', dni: '123A', estado: 'Alta', categoria: { id: 1, nombre: 'Jefe Proyecto', precio_hora_coste: 50, precio_hora_trabajador: 100 } }
    },
    {
      id: 2, usuario: 'pepe', isAdmin: false,
      worker: { id: 2, nombre: 'Pepe', apellido: 'García', dni: '456B', estado: 'Baja', categoria: { id: 2, nombre: 'Junior Dev', precio_hora_coste: 20, precio_hora_trabajador: 40 } }
    },
  ];

  getSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    return status === 'Alta' ? 'success' : 'danger';
  }
}
