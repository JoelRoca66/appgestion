import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/login';

    login(username: string, password: string): Observable<User> {
        return this.http.post<any>(`${this.apiUrl}`, { username, password });
    }

}