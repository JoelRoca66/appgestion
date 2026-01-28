import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/auth';

    login(usuario: string, contrasena: string): Observable<User> {
        return this.http.post<any>(`${this.apiUrl}/login`, { usuario, contrasena });
    }
    
    updatePassword(user: User): Observable<User> {
        const aux = {
            id_usuario: user.id_trabajador,
            nueva_contrasena: user.contrasena
        }
        return this.http.post<any>(`${this.apiUrl}/update-password`, aux)
    }
}