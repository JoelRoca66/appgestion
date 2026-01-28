export interface Project {
    id: number;
    nombre: string;
    descripcion: string;
    estado: string;
    fecha_ini: Date;
    fecha_fin: Date;
    margen_beneficio: number;
    
    totalTareas?: number;
    tareasCompletadas?: number;
}

export interface ProjectDTO {
    id: number;
    nombre: string;
}
export interface TareaLazyDTO {
  id: number;
  descripcion: string;
  estado: string;
  fecha_fin: string | null;
  fecha_ini: string | null;
  horas_estimadas: number;
  nombre: string;
  observaciones?: string | null;
  tipo: string;
  id_proyecto: number;
  tarea_padre: number | null;
  subtareas?: TareaLazyDTO[] | null;
}

export interface ProyectoTareasDTO {
  id: number;
  descripcion: string;
  estado: string;
  fecha_ini: string | null;
  fecha_fin: string | null;
  margen_beneficio: number;
  nombre: string;
  tareas_principales: TareaLazyDTO[];
}
