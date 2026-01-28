import { Project } from "./project.model";

export type TaskState = 'PENDIENTE' | 'EN_PROCESO' | 'BLOQUEADA' | 'REVISION' | 'COMPLETADA';

export interface TaskLite {
    id: number;
    nombre: string;
}

export interface Task {
    id: number;
    nombre: string;
    descripcion: string;
    tipo: string;
    estado: TaskState;
    observaciones?: string;

    horas_estimadas: number;
    fecha_ini?: Date;
    fecha_fin?: Date;

    tarea_padre?: TaskLite;
    proyecto: Project;


    subtareas?: Task[];
}

export interface TaskDTO {
    id: number;
    nombre: string;
    descripcion: string;
    tipo: string;
    estado: TaskState;
    observaciones?: string;

    horas_estimadas: number;
    fecha_ini?: Date;
    fecha_fin?: Date;

    tarea_padre?: TaskLite;
    id_proyecto: Project;


    subtareas_ids?: number[];
}

export interface TaskListDTO {
    id: number;
    nombre: string;
}
export interface ProyectoDTOTarea {
  id: number;
  nombre: string;
}

export interface TareaDTOTarea {
  id: number;
  nombre: string;
}

export interface TareaJornadaDTO {
  id: number;
  descripcion: string;
  estado: string;
  fecha_ini: string;
  fecha_fin: string;
  horas_estimadas: number;
  nombre: string;
  observaciones: string;
  tipo: string;
  id_proyecto: ProyectoDTOTarea;
  tarea_padre: TareaDTOTarea | null;
  fecha: string;
  horas: number;
  validado: boolean;
}
