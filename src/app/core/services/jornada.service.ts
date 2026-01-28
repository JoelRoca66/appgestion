import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JornadaService {

    private apiUrl = 'http://localhost:8080/jornada';

  constructor(private http: HttpClient) {}

  countNoValidadas() {
    return this.http.get<number>(`${this.apiUrl}/count/no_validadas`);
  }

  getNoValidadas(page = 0, size = 10) {
    return this.http.get<any>(
      `${this.apiUrl}/all/no_validadas?page=${page}&size=${size}`
    );
  }

  validarJornada(id: number) {
    return this.http.put(`${this.apiUrl}/validar/${id}`, {});
  }
}
