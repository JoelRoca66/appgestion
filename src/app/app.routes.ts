import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login'; 
import { MainLayout } from './layout/main-layout/main-layout';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';
import { Maintenance } from './features/admin/maintenance/maintenance';
import { MaintenanceCategory } from './features/admin/maintenance-category/maintenance-category';
import { MaintenanceWorker } from './features/admin/maintenance-worker/maintenance-worker';
import { MaintenanceProject } from './features/admin/maintenance-project/maintenance-project';
import { MaintenanceRecord } from './features/admin/maintenance-record/maintenance-record';
import { MaintenanceTask } from './features/admin/maintenance-task/maintenance-task';
import { MaintenanceUser } from './features/admin/maintenance-user/maintenance-user';
import { MaintenanceMaterial } from './features/admin/maintenance-material/maintenance-material';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: '',
        component: MainLayout,
        children: [
                { path: 'admin', component: AdminDashboard },
                { path: '', redirectTo: 'admin', pathMatch: 'full' },
                { path: 'mantenimiento', component: Maintenance},
                { path: 'mantenimiento/categorias', component: MaintenanceCategory },
                { path: 'mantenimiento/trabajadores', component: MaintenanceWorker },
                { path: 'mantenimiento/proyectos', component: MaintenanceProject },
                { path: 'mantenimiento/registros', component: MaintenanceRecord },
                { path: 'mantenimiento/tareas', component: MaintenanceTask },
                { path: 'mantenimiento/usuarios', component: MaintenanceUser },
                { path: 'mantenimiento/materiales', component: MaintenanceMaterial }
        ]
    },
    { path: '**', redirectTo: 'login' }
];