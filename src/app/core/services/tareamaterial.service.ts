import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TareaMaterial } from '../models/tareamaterial.model';

@Injectable({
  providedIn: 'root'
})
export class TareaMaterialService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/tareamaterial';

  constructor() { }

  addMaterial(body: TareaMaterial): Observable<TareaMaterial> {
    return this.http.post<TareaMaterial>(`${this.apiUrl}/add`, body);
  }
  getByTarea(id_tarea: number): Observable<TareaMaterial[]> {
    return this.http.get<TareaMaterial[]>(`${this.apiUrl}/tarea/${id_tarea}`);
  }
}