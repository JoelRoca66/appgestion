export interface TaskFilter {
    term: string;
    tipo?: string;
    estado?: string;
    fecha_inicio_desde?: Date;
    fecha_inicio_hasta?: Date;
    fecha_fin_desde?: Date;
    fecha_fin_hasta?: Date;
    padre?: number;
    proyecto?: number;
}