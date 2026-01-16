import { Project } from "./project.model";

export type TaskState = 'PENDIENTE' | 'EN_PROCESO' | 'BLOQUEADA' | 'REVISION' | 'COMPLETADA';

export interface TaskLite {
    id: number;
    nombre: string;
    estado: string;
}

export interface Task {
    id: number;
    nombre: string;
    descripcion: string;
    tipo: string;
    estado: TaskState;
    observaciones?: string;

    horasEstimadas: number;
    fechaIni?: Date;
    fechaFin?: Date;

    padre?: TaskLite;
    proyecto: Project;


    subtareas?: Task[];
}