import { Injectable, inject } from '@angular/core';
import { Category, CategoryDTO } from '../models/category.model';
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
export class CategoryService {
    private http = inject(HttpClient);

    private apiUrl = 'http://localhost:8080/categoria';

    getCategorias(page: number, size: number): Observable<PageResponse<Category>> {
        return this.http.get<PageResponse<Category>>(`${this.apiUrl}/all`, { params: { page, size } });
    }

    getCategoriasDTO(): Observable<CategoryDTO[]> {
        return this.http.get<CategoryDTO[]>(`${this.apiUrl}/all/nombres`);
    }
    searchCategoria(term: string, page: number, size: number): Observable<PageResponse<Category>> {
        const params = new HttpParams()
            .set('texto', term)
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<Category>>(
            `${this.apiUrl}/search`,
            { params }
        );
    }

    create(category: Category): Observable<Category> {
        return this.http.post<Category>(`${this.apiUrl}/add`, category);
    }

    update(category: Category): Observable<Category> {
        return this.http.put<Category>(`${this.apiUrl}/update`, category);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }
}