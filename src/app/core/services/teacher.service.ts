import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Teacher } from '../models/teacher.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private api = inject(ApiService);

  getAll(): Observable<Teacher[]> {
    return this.api.getList<Teacher>('/teachers/');
  }

  getById(id: string): Observable<Teacher> {
    return this.api.get<Teacher>(`/teachers/${id}/`);
  }

  getByEmail(email: string): Observable<Teacher[]> {
    return this.api.getList<Teacher>('/teachers/', { search: email });
  }

  login(email: string, password: string): Observable<Teacher> {
    return this.api.post<Teacher>('/teachers/login/', { email, password });
  }

  getCurrentTeacher(): Teacher | null {
    const data = localStorage.getItem('teacher');
    return data ? JSON.parse(data) : null;
  }

  setCurrentTeacher(teacher: Teacher): void {
    localStorage.setItem('teacher', JSON.stringify(teacher));
  }

  logout(): void {
    localStorage.removeItem('teacher');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('teacher');
  }
}
