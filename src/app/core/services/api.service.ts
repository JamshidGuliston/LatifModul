import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  get<T>(url: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<T>(url, { params: httpParams });
  }

  // Get list with automatic handling of paginated responses
  getList<T>(url: string, params?: Record<string, string>): Observable<T[]> {
    return this.get<T[] | PaginatedResponse<T>>(url, params).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.results || [];
      })
    );
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(url, body);
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(url, body);
  }

  patch<T>(url: string, body: any): Observable<T> {
    return this.http.patch<T>(url, body);
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url);
  }
}
