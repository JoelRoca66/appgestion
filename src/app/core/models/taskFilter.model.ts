export interface TaskFilter {
    term: string;
    tipo?: string;
    estado?: string;
    fechaInicioDesde?: Date;
    fechaInicioHasta?: Date;
    fechaFinDesde?: Date;
    fechaFinHasta?: Date;
    padre?: number;
    proyecto?: number;
}