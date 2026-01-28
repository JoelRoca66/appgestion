import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
@Injectable({
  providedIn: 'root'
})

export class TareaMaterial {
  private http =inject(HttpClient)
  private apiUrl = 'http://localhost:8080/tareamaterial'
  
  create(tarea: TareaMaterial): Observable<TareaMaterial>{
    return this.http.post<TareaMaterial>(`${this.apiUrl}/add`,tarea)
  }
  constructor() { }

}
