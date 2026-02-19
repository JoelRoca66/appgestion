import { TaskListDTO, TaskListValidarDTO } from "./task.model";
import { WorkerNameDTO } from "./worker.model";

export interface Record {
    id: number;
    fecha: Date;
    horas: number;
    validado: boolean;
    id_tarea: TaskListDTO;
    id_trabajador: WorkerNameDTO;
}

export interface RecordValidarDTO {
    id: number;
    fecha: Date;
    horas: number;
    validado: boolean;
    id_tarea: TaskListValidarDTO;
    id_trabajador: WorkerNameDTO;
}
export interface JornadaDTO {
  fecha: string;
  horas: number;
  validado: boolean;
  id_tarea: number;
  id_trabajador: number;
}
