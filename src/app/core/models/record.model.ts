import { TaskListDTO } from "./task.model";
import { WorkerNameDTO } from "./worker.model";

export interface Record {
    id: number;
    fecha: Date;
    horas: number;
    validado: boolean;
    id_tarea: TaskListDTO;
    id_trabajador: WorkerNameDTO;
}