import { Worker } from './worker.model';

export interface User {
    id: number;
    usuario: string;
    isAdmin: boolean;

    worker?: Worker;
}