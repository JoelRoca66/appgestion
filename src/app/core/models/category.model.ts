export interface Category {
    id: number;
    nombre: string;
    precio_hora_coste: number;       
    precio_hora_trabajador: number;
}

export interface CategoryDTO {
    id:number;
    nombre: string;
}