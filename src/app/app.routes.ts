import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Maintenance } from './features/admin/maintenance/maintenance';
import { MaintenanceCategory } from './features/admin/maintenance-category/maintenance-category';
import { MaintenanceWorker } from './features/admin/maintenance-worker/maintenance-worker';
import { MaintenanceProject } from './features/admin/maintenance-project/maintenance-project';
import { MaintenanceRecord } from './features/admin/maintenance-record/maintenance-record';
import { MaintenanceTask } from './features/admin/maintenance-task/maintenance-task';
import { MaintenanceUser } from './features/admin/maintenance-user/maintenance-user';
import { MaintenanceMaterial } from './features/admin/maintenance-material/maintenance-material';
import { AdminConfig } from './features/admin/admin-config/admin-config';

import { authGuard, adminGuard, guestGuard } from './guards/auth.guard';
import { MainLayout } from './layout/main-layout/main-layout';
import { UserHomeComponent } from './features/user/home/home';
import { JornadaNoValidada } from './features/admin/JornadaNoValidada/JornadaNoValidada';
import { ProyectosComponent } from './features/user/proyectos.component/proyectos.component';
import { ProyectosDetallesComponent } from './features/user/proyectos-detalles.component/proyectos-detalles.component';
import { TareasComponent } from './features/user/tareas.component/tareas.component';
import { TareasDetallesComponent } from './features/user/tareas-detalles.component/tareas-detalles.component';
import { KanbanComponent } from './features/user/kanban/kanban';
import { Configuracion } from './features/user/configuracion/configuracion';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard]
  },

  {
    path: 'admin',
    component: MainLayout,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: UserHomeComponent },
      { path: 'mantenimiento', component: Maintenance },
      { path: 'mantenimiento/categorias', component: MaintenanceCategory },
      { path: 'mantenimiento/trabajadores', component: MaintenanceWorker },
      { path: 'mantenimiento/proyectos', component: MaintenanceProject },
      { path: 'mantenimiento/registros', component: MaintenanceRecord },
      { path: 'mantenimiento/tareas', component: MaintenanceTask },
      { path: 'mantenimiento/usuarios', component: MaintenanceUser },
      { path: 'mantenimiento/materiales', component: MaintenanceMaterial },
      { path: 'jornadas/no-validadas', component: JornadaNoValidada },
      { path: 'config', component: AdminConfig }
    ]
  },

  {
    path: 'user',
    component: MainLayout,
    canActivate: [authGuard],
    //canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: UserHomeComponent },
      { path: 'proyectos', component: ProyectosComponent },
      { path: 'proyectos/:id', component: ProyectosDetallesComponent },
      { path: 'tareas', component: TareasComponent },
      { path: 'tareas/:id', component: TareasDetallesComponent },
      { path: 'kanban', component: KanbanComponent },
      { path: 'config', component: Configuracion }
    ]
  },

  { path: '**', redirectTo: '/login' }
];