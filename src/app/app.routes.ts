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
import { adminGuard, authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: '',
        component: MainLayout,
        children: [
            // { path: 'admin', component: AdminDashboard, canActivate: [adminGuard] },
            // { path: 'mantenimiento', component: Maintenance, canActivate: [adminGuard] },
            // { path: 'mantenimiento/categorias', component: MaintenanceCategory, canActivate: [adminGuard] },
            // { path: 'mantenimiento/trabajadores', component: MaintenanceWorker, canActivate: [adminGuard] },
            // { path: 'mantenimiento/proyectos', component: MaintenanceProject, canActivate: [adminGuard] },
            // { path: 'mantenimiento/registros', component: MaintenanceRecord, canActivate: [adminGuard] },
            // { path: 'mantenimiento/tareas', component: MaintenanceTask, canActivate: [adminGuard] },
            // { path: 'mantenimiento/usuarios', component: MaintenanceUser, canActivate: [adminGuard] },
            // { path: 'mantenimiento/materiales', component: MaintenanceMaterial, canActivate: [adminGuard] }
            { path: 'admin/dashboard', component: AdminDashboard },
            { path: 'admin/mantenimiento', component: Maintenance },
            { path: 'admin/mantenimiento/categorias', component: MaintenanceCategory },
            { path: 'admin/mantenimiento/trabajadores', component: MaintenanceWorker },
            { path: 'admin/mantenimiento/proyectos', component: MaintenanceProject },
            { path: 'admin/mantenimiento/registros', component: MaintenanceRecord },
            { path: 'admin/mantenimiento/tareas', component: MaintenanceTask },
            { path: 'admin/mantenimiento/usuarios', component: MaintenanceUser },
            { path: 'admin/mantenimiento/materiales', component: MaintenanceMaterial }

        ]
    },
    { path: '**', redirectTo: 'login' }
];