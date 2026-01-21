import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Task } from '../models/task.model';
import { TaskFilter } from '../models/taskFilter.model';
import { create } from 'domain';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
@Injectable({ providedIn: 'root' })
export class TaskService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/tarea';

    getTasks(page: number, size: number): Observable<PageResponse<Task>> {
        return this.http.get<PageResponse<Task>>(`${this.apiUrl}/all`, { params: { page, size } });
    }

    searchTask(filter: TaskFilter, page: number, size: number): Observable<PageResponse<Task>> {
        const params = new HttpParams()
            .set('texto', filter.texto)
            .set('tipo', filter.tipo ? filter.tipo : '')
            .set('estado', filter.estado ? filter.estado : '')
            .set('fechaInicioDesde', filter.fecha_inicio_desde ? filter.fecha_inicio_desde.toISOString() : '')
            .set('fechaInicioHasta', filter.fecha_inicio_hasta ? filter.fecha_inicio_hasta.toISOString() : '')
            .set('fechaFinDesde', filter.fecha_fin_desde ? filter.fecha_fin_desde.toISOString() : '')
            .set('fechaFinHasta', filter.fecha_fin_hasta ? filter.fecha_fin_hasta.toISOString() : '')
            .set('padre', filter.padre ? filter.padre.toString() : '')
            .set('proyecto', filter.proyecto ? filter.proyecto.toString() : '')
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageResponse<any>>(
            `${this.apiUrl}/search`,
            { params }
        );
    }

    createTask(task: Task): Observable<Task> {
        return this.http.post<Task>(`${this.apiUrl}/add`, task);
    }

    updateTask(task: Task): Observable<Task> {
        return this.http.put<Task>(`${this.apiUrl}/update`, task);
    }

    deleteTask(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<Task> {
        return this.http.get<Task>(`${this.apiUrl}/find/${id}`);
    }
}