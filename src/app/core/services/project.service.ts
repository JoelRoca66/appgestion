import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Project, ProjectDTO } from '../models/project.model';
import { ProjectFilter } from '../models/projectFilter.model';
import { formatDateLocal } from '../../features/utilidades/date-utils';
import { ProyectoTareasDTO } from '../models/project.model';
import { MaterialAgrupadoDTO } from '../models/tareamaterial.model';


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
            .set('texto', filter.texto ?? '')
            .set('estado', filter.estado ?? '')
            .set('margenBeneficioMin', filter.margen_beneficio_min?.toString() ?? '')
            .set('fecha_ini_desde', formatDateLocal(filter.fecha_inicio_desde))
            .set('fecha_ini_hasta', formatDateLocal(filter.fecha_inicio_hasta))
            .set('fecha_fin_desde', formatDateLocal(filter.fecha_fin_desde))
            .set('fecha_fin_hasta', formatDateLocal(filter.fecha_fin_hasta))
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


    findById(id: number): Observable<ProyectoTareasDTO> {
        return this.http.get<ProyectoTareasDTO>(`${this.apiUrl}/find/${id}`);
    }


    getAllProjectNames(): Observable<ProjectDTO[]> {
        return this.http.get<ProjectDTO[]>(`${this.apiUrl}/all/nombres`);
    }
    getNameById(id: number): Observable<string> {
        return this.http.get<string>(`${this.apiUrl}/${id}/nombre`);
    }

    getMaterialesProyecto(id: number): Observable<MaterialAgrupadoDTO[]> {
        return this.http.get<MaterialAgrupadoDTO[]>(`${this.apiUrl}/${id}/materiales`);
    }

    descargarInformeProyecto(id: number): Observable<HttpResponse<Blob>> {
        return this.http.get(`${this.apiUrl}/report/${id}`, { observe: 'response', responseType: 'blob' });
    }
}