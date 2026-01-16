export interface Project {
    id: number;
    nombre: string;
    descripcion: string;
    estado: string;
    fechaIni: Date;
    fechaFin?: Date;
    margenBeneficio: number;
    
    totalTareas?: number;
    tareasCompletadas?: number;
}