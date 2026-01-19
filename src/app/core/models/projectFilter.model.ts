export interface ProjectFilter {
    term: string;
    clienteId?: number;
    fechaInicioDesde?: Date;
    fechaInicioHasta?: Date;
    fechaFinDesde?: Date;
    fechaFinHasta?: Date;
}