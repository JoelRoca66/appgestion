import { Injectable, inject } from '@angular/core';
import { Material } from '../models/material.model';
import { MaterialFilter } from '../models/MaterialFilterModel';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
@Injectable({ providedIn: 'root' })
export class MaterialService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/material';

    getMaterials(page: number, size: number): Observable<PageResponse<Material>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<Material>>(`${this.apiUrl}/page`, { params });
    }

    searchMaterial(filter: MaterialFilter, page: number, size: number): Observable<PageResponse<Material>> {
        let params = new HttpParams()
            .set('term', filter.term)
            .set('num_factura', filter.num_factura ? filter.num_factura : '')
            .set('referencia', filter.referencia ? filter.referencia : '')
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<Material>>(`${this.apiUrl}/search`, { params });
    }

    create(material: Material): Observable<Material> {
        return this.http.post<Material>(`${this.apiUrl}/add`, material);
    }

    update(material: Material): Observable<Material> {
        return this.http.put<Material>(`${this.apiUrl}/update`, material);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<Material> {
        return this.http.get<Material>(`${this.apiUrl}/find/${id}`);
    }

}