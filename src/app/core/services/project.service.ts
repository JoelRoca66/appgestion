import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Project } from '../models/project.model';
import { ProjectFilter } from '../models/projectFilter.model';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/project';

    getProjects(page: number, size: number): Observable<PageResponse<Project>> {
        return this.http.get<PageResponse<Project>>(`${this.apiUrl}/all`, { params: { page, size } });
    }

    searchProject(filter: ProjectFilter, page: number, size: number): Observable<PageResponse<Project>> {
        const params = new HttpParams()
            .set('term', filter.term)
            .set('clienteId', filter.clienteId ? filter.clienteId.toString() : '')
            .set('fechaInicioDesde', filter.fechaInicioDesde ? filter.fechaInicioDesde.toISOString() : '')
            .set('fechaInicioHasta', filter.fechaInicioHasta ? filter.fechaInicioHasta.toISOString() : '')
            .set('fechaFinDesde', filter.fechaFinDesde ? filter.fechaFinDesde.toISOString() : '')
            .set('fechaFinHasta', filter.fechaFinHasta ? filter.fechaFinHasta.toISOString() : '')
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageResponse<any>>(`${this.apiUrl}/search`, { params });
    }

    createProject(project: Project): Observable<Project> {
        return this.http.post<Project>(`${this.apiUrl}/create`, project);
    }

    updateProject(project: Project): Observable<Project> {
        return this.http.put<Project>(`${this.apiUrl}/update/${project.id}`, project);
    }

    deleteProject(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<Project> {
        return this.http.get<Project>(`${this.apiUrl}/find/${id}`);
    }
}