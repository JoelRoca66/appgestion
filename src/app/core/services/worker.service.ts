import { Injectable, inject } from '@angular/core';
import { Worker } from '../models/worker.model';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WorkerFilter } from '../models/workerFilter.model';

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
            .set('texto', filtro.term)
            .set('estado', filtro.estado ? filtro.estado : '')
            .set('categoriaId', filtro.categoriaId ? filtro.categoriaId : 0)
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<Worker>>(
            `${this.apiUrl}/search`,
            { params }
        );
    }

    create(worker: Worker): Observable<Worker> {
        return this.http.post<Worker>(`${this.apiUrl}/add`, worker);
    }

    update(worker: Worker): Observable<Worker> {
        return this.http.put<Worker>(`${this.apiUrl}/update`, worker);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<Worker> {
        return this.http.get<Worker>(`${this.apiUrl}/find/${id}`);
    }
}