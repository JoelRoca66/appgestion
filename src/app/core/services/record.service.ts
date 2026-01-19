import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RecordFilter } from '../models/recordFilter.model';
import { Record } from '../models/record.model';


export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

@Injectable({ providedIn: 'root'})
export class RecordService {
    private http = inject(HttpClient)
    private apiUrl = 'http://localhost:8080/record';

    getRecords(page: number, size: number): Observable<PageResponse<Record>> {
        return this.http.get<PageResponse<Record>>(`${this.apiUrl}/all`, { params: { page, size } });
    }

    searchRecord(filter: RecordFilter, page: number, size: number): Observable<PageResponse<Record>> {
        const params = new HttpParams()
            .set('fechaDesde', filter.fechaDesde ? filter.fechaDesde.toISOString() : '')
            .set('fechaHasta', filter.fechaHasta ? filter.fechaHasta.toISOString() : '')
            .set('usuarioId', filter.usuarioId ? filter.usuarioId.toString() : '')
            .set('tareaId', filter.tareaId ? filter.tareaId.toString() : '')
            .set('validado', filter.validado !== undefined ? filter.validado.toString() : '')
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageResponse<any>>(
            `${this.apiUrl}/search`,
            { params }
        );
    }

    createRecord(record: Record): Observable<Record> {
        return this.http.post<Record>(`${this.apiUrl}/create`, record);
    }

    updateRecord(record: Record): Observable<Record> {
        return this.http.put<Record>(`${this.apiUrl}/update/${record.id}`, record);
    }

    deleteRecord(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<Record> {
        return this.http.get<Record>(`${this.apiUrl}/find/${id}`);
    }
}