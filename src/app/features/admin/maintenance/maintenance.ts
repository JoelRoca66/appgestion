import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-maintenance',
  imports: [ CommonModule, TableModule, TagModule, CardModule, ButtonModule, RouterModule ],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.css',
})
export class Maintenance {

  opciones: any[] = [
    { nombre: 'Gestión de Usuarios', descripcion: 'Crear, editar y eliminar usuarios del sistema.', ruta: '/admin/mantenimiento/usuarios' },
    { nombre: 'Gestión de Proyectos', descripcion: 'Administrar proyectos y sus detalles.', ruta: '/admin/mantenimiento/proyectos' },
    { nombre: 'Gestión de Tareas', descripcion: 'Crear y asignar tareas a los trabajadores.', ruta: '/admin/mantenimiento/tareas' },
    { nombre: 'Gestión de Trabajadores', descripcion: 'Administrar la información de los trabajadores.', ruta: '/admin/mantenimiento/trabajadores' },
    { nombre: 'Gestión de Categorías', descripcion: 'Definir y modificar categorías de trabajadores.', ruta: '/admin/mantenimiento/categorias' },
    { nombre: 'Gestión de Registros', descripcion: 'Ver y gestionar los registros de horas trabajadas.', ruta: '/admin/mantenimiento/registros' },
    { nombre: 'Gestión de Materiales', descripcion: 'Administrar el inventario de materiales.', ruta: '/admin/mantenimiento/materiales' },
  ];
}
