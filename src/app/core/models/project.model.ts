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