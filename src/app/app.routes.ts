import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login'; 
import { MainLayout } from './layout/main-layout/main-layout';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';
import { Maintenance } from './features/admin/maintenance/maintenance';
import { MaintenanceCategory } from './features/admin/maintenance-category/maintenance-category';
import { MaintenanceWorker } from './features/admin/maintenance-worker/maintenance-worker';

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
                { path: 'mantenimiento/trabajadores', component: MaintenanceWorker }
        ]
    },
    { path: '**', redirectTo: 'login' }
];