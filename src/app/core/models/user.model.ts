import { Worker } from './worker.model';

export interface User {
    id_trabajador: number;
    usuario: string;
    rol: boolean;
    contrasena: string;
    cambio_contrasena: boolean;

    worker?: Worker;
}