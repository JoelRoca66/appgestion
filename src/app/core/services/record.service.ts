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
    private apiUrl = 'http://localhost:8080/jornada';

    getRecords(page: number, size: number): Observable<PageResponse<Record>> {
        return this.http.get<PageResponse<Record>>(`${this.apiUrl}/all`, { params: { page, size } });
    }

    searchRecord(filter: RecordFilter, page: number, size: number): Observable<PageResponse<Record>> {
        const params = new HttpParams()
            .set('fecha_desde', filter.fecha_desde ? filter.fecha_desde.toLocaleDateString('sv') : '')
            .set('fecha_hasta', filter.fecha_hasta ? filter.fecha_hasta.toLocaleDateString('sv') : '')
            .set('validado', filter.validado )
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PageResponse<any>>(
            `${this.apiUrl}/search`,
            { params }
        );
    }

    createRecord(record: Record): Observable<Record> {
        return this.http.post<Record>(`${this.apiUrl}/add`, record);
    }

    updateRecord(record: Record): Observable<Record> {
        const aux = { 
            id: record.id,
            fecha: record.fecha.toLocaleDateString('sv'),
            horas: record.horas,
            validado: record.validado,
            id_tarea: record.id_tarea.id,
            id_trabajador: record.id_trabajador.id
        }
        return this.http.put<Record>(`${this.apiUrl}/update`, aux);
    }

    deleteRecord(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<Record> {
        return this.http.get<Record>(`${this.apiUrl}/find/${id}`);
    }
}