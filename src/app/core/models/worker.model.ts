import { Category } from "./category.model";

export interface Worker {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    estado: string;

    id_categoria: Category;
}

export interface WorkerNameDTO {
    id: number;
    dni: string;
}