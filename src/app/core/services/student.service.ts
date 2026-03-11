import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Student, StudentCreate } from '../models/student.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private api = inject(ApiService);
  private readonly STORAGE_KEY = 'current_student';

  getAll(teacherId?: string): Observable<Student[]> {
    const params = teacherId ? { teacher_id: teacherId } : undefined;
    return this.api.getList<Student>('/students/', params);
  }

  getById(id: string): Observable<Student> {
    return this.api.get<Student>(`/students/${id}/`);
  }

  create(student: StudentCreate): Observable<Student> {
    return this.api.post<Student>('/students/', student);
  }

  update(id: string, student: Partial<Student>): Observable<Student> {
    return this.api.patch<Student>(`/students/${id}/`, student);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/students/${id}/`);
  }

  login(email: string, password: string): Observable<Student> {
    return this.api.post<Student>('/students/login/', { email, password });
  }

  getCurrentStudent(): Student | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  setCurrentStudent(student: Student): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(student));
  }

  isStudentLoggedIn(): boolean {
    return !!localStorage.getItem(this.STORAGE_KEY);
  }

  studentLogout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
