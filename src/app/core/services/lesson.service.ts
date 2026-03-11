import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Lesson, LessonDetail } from '../models/lesson.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private api = inject(ApiService);

  getAll(moduleId?: string): Observable<Lesson[]> {
    const params = moduleId ? { module_id: moduleId } : undefined;
    return this.api.getList<Lesson>('/lessons/', params);
  }

  getById(id: string): Observable<LessonDetail> {
    return this.api.get<LessonDetail>(`/lessons/${id}/`);
  }

  create(lesson: Partial<Lesson>): Observable<Lesson> {
    return this.api.post<Lesson>('/lessons/', lesson);
  }

  update(id: string, lesson: Partial<Lesson>): Observable<Lesson> {
    return this.api.patch<Lesson>(`/lessons/${id}/`, lesson);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/lessons/${id}/`);
  }
}
