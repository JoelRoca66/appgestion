import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User } from '../models/user.model';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/trabajador';

    getUsers(page: number, size: number): Observable<PageResponse<User>> {
        return this.http.get<PageResponse<User>>(`${this.apiUrl}/all`, { params: { page, size } });
    }

    searchUser(term: string, page: number, size: number): Observable<PageResponse<User>> {
        const params = new HttpParams()
            .set('texto', term)
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PageResponse<User>>(
            `${this.apiUrl}/search`,
            { params }
        );
    }

    create(user: User): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/add`, user);
    }

    update(user: User): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/update`, user);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    findById(id: number): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/find/${id}`);
    }
}