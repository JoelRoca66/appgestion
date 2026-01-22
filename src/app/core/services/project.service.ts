import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Project, ProjectDTO } from '../models/project.model';
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
    private apiUrl = 'http://localhost:8080/proyecto';

    getProjects(page: number, size: number): Observable<PageResponse<Project>> {
        return this.http.get<PageResponse<Project>>(`${this.apiUrl}/all`, { params: { page, size } });
    }

    searchProject(filter: ProjectFilter, page: number, size: number): Observable<PageResponse<Project>> {
        const params = new HttpParams()
            .set('texto', filter.texto)
            .set('estado', filter.estado ? filter.estado : '')
            .set('margenBeneficioMin', filter.margen_beneficio_min ? filter.margen_beneficio_min.toString().split('T')[0] : '')
            .set('fechaInicioDesde', filter.fecha_inicio_desde ? filter.fecha_inicio_desde.toISOString().split('T')[0] : '')
            .set('fechaInicioHasta', filter.fecha_inicio_hasta ? filter.fecha_inicio_hasta.toISOString().split('T')[0] : '')
            .set('fechaFinDesde', filter.fecha_fin_desde ? filter.fecha_fin_desde.toISOString().split('T')[0] : '')
            .set('fechaFinHasta', filter.fecha_fin_hasta ? filter.fecha_fin_hasta.toISOString().split('T')[0] : '')
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageResponse<any>>(`${this.apiUrl}/search`, { params });
    }

    createProject(project: Project): Observable<Project> {
        return this.http.post<Project>(`${this.apiUrl}/add`, project);
    }

    updateProject(project: Project): Observable<Project> {
        return this.http.put<Project>(`${this.apiUrl}/update`, project);
    }

    deleteProject(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<Project> {
        return this.http.get<Project>(`${this.apiUrl}/find/${id}`);
    }

    getAllProjectNames(): Observable<ProjectDTO[]> {
        return this.http.get<ProjectDTO[]>(`${this.apiUrl}/all/nombres`);
    }
}