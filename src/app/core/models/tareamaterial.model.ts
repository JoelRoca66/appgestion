import { Material } from "./material.model"

export interface TareaMaterial {
    id_tarea: number,
    id_material: number,
    cantidad: number
}

export interface MaterialAgrupadoDTO {
    material: Material,
    cantidadTotal: number,
    precioTotal: number
 }