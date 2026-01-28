import { Injectable, inject } from '@angular/core';
import { Worker } from '../models/worker.model';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WorkerFilter } from '../models/workerFilter.model';
import { TareaJornadaDTO } from '../models/task.model';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

@Injectable({ providedIn: 'root' })
export class WorkerService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/trabajador';

    getWorkers(page: number, size: number): Observable<PageResponse<Worker>> {
        return this.http.get<PageResponse<Worker>>(`${this.apiUrl}/all`, { params: { page, size } });
    }

    searchWorker(filtro: WorkerFilter, page: number, size: number): Observable<PageResponse<Worker>> {
        const params = new HttpParams()
            .set('texto', filtro.texto)
            .set('estado', filtro.estado ? filtro.estado : '')
            .set('id_categoria', filtro.id_categoria ? filtro.id_categoria : 0)
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<Worker>>(
            `${this.apiUrl}/search`,
            { params }
        );
    }

    create(worker: Worker, rol: boolean): Observable<Worker> {
        const aux = {
            nombre: worker.nombre,
            apellido: worker.apellido,
            dni: worker.dni,
            estado: worker.estado,
            id_categoria: worker.id_categoria.id,
            rol: rol
        }
        return this.http.post<Worker>(`${this.apiUrl}/add`, aux);
    }

    update(worker: Worker): Observable<Worker> {
        const aux = {
            id: worker.id,
            nombre: worker.nombre,
            apellido: worker.apellido,
            dni: worker.dni,
            estado: worker.estado,
            id_categoria: worker.id_categoria.id
        }
        return this.http.put<Worker>(`${this.apiUrl}/update`, aux);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<Worker> {
        return this.http.get<Worker>(`${this.apiUrl}/find/${id}`);
    }
    getTareasTrabajador(
        trabajadorId: number, 
        page: number = 0, 
        size: number = 10
    ): Observable<PageResponse<TareaJornadaDTO>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<TareaJornadaDTO>>(
            `${this.apiUrl}/${trabajadorId}/tareas`,
            { params }
        );
    }
}


