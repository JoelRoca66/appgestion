import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Task, TaskDTO, TaskListDTO } from '../models/task.model';
import { TaskFilter } from '../models/taskFilter.model';
import { create } from 'domain';
import { TareaLazyDTO } from '../models/project.model';

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

    getTasks(page: number, size: number): Observable<PageResponse<TaskDTO>> {
        return this.http.get<PageResponse<TaskDTO>>(`${this.apiUrl}/all`, { params: { page, size } });
    }

    searchTask(filter: TaskFilter, page: number, size: number): Observable<PageResponse<TaskDTO>> {
        const params = new HttpParams()
            .set('term', filter.term)
            .set('tipo', filter.tipo ? filter.tipo : '')
            .set('estado', filter.estado ? filter.estado : '')
            .set('fecha_inicio_desde', filter.fecha_inicio_desde ? filter.fecha_inicio_desde.toLocaleDateString('sv') : '')
            .set('fecha_inicio_hasta', filter.fecha_inicio_hasta ? filter.fecha_inicio_hasta.toLocaleDateString('sv') : '')
            .set('fecha_fin_desde', filter.fecha_fin_desde ? filter.fecha_fin_desde.toLocaleDateString('sv') : '')
            .set('fecha_fin_hasta', filter.fecha_fin_hasta ? filter.fecha_fin_hasta.toLocaleDateString('sv') : '')
            .set('padre', filter.padre ? filter.padre.toString() : '')
            .set('proyecto', filter.proyecto ? filter.proyecto.toString() : '')
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageResponse<TaskDTO>>(
            `${this.apiUrl}/search`,
            { params }
        );
    }

    createTask(task: Task): Observable<Task> {
        const aux = {
            nombre: task.nombre,
            descripcion: task.descripcion,
            tipo: task.tipo,
            estado: task.estado,
            observaciones: task.observaciones,
            horas_estimadas: task.horas_estimadas,
            fecha_ini: task.fecha_ini,
            fecha_fin: task.fecha_fin,
            tarea_padre: task.tarea_padre ? task.tarea_padre.id : null,
            id_proyecto: task.proyecto.id
        }
        return this.http.post<Task>(`${this.apiUrl}/add`, aux);
    }

    updateTask(task: Task): Observable<Task> {
        const aux = {
            id: task.id,
            nombre: task.nombre,
            descripcion: task.descripcion,
            tipo: task.tipo,
            estado: task.estado,
            observaciones: task.observaciones,
            horas_estimadas: task.horas_estimadas,
            fecha_ini: task.fecha_ini,
            fecha_fin: task.fecha_fin,
            tarea_padre: task.tarea_padre ? task.tarea_padre.id : null,
            id_proyecto: task.proyecto.id
        }
        return this.http.put<Task>(`${this.apiUrl}/update`, aux);
    }

    deleteTask(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<TareaLazyDTO> {
        return this.http.get<TareaLazyDTO>(`${this.apiUrl}/find/${id}`);
    }


    getAllTaskNamesFromProject(id: number): Observable<TaskListDTO[]> {
        return this.http.get<TaskListDTO[]>(`${this.apiUrl}/all/nombres`, { params: { id } });
    }
    getNameById(id: number): Observable<string> {
        return this.http.get(`${this.apiUrl}/nombre/${id}`, {
            responseType: 'text'
        });
    }
}