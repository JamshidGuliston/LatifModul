import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ContentType, ModuleContent, LessonContent } from '../models/content.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private api = inject(ApiService);

  getContentTypes(): Observable<ContentType[]> {
    return this.api.getList<ContentType>('/content-types/');
  }

  // Module Contents
  getModuleContents(moduleId: string): Observable<ModuleContent[]> {
    return this.api.getList<ModuleContent>('/module-contents/', { module_id: moduleId });
  }

  createModuleContent(content: Partial<ModuleContent>): Observable<ModuleContent> {
    return this.api.post<ModuleContent>('/module-contents/', content);
  }

  updateModuleContent(id: string, content: Partial<ModuleContent>): Observable<ModuleContent> {
    return this.api.patch<ModuleContent>(`/module-contents/${id}/`, content);
  }

  deleteModuleContent(id: string): Observable<void> {
    return this.api.delete<void>(`/module-contents/${id}/`);
  }

  // Lesson Contents
  getLessonContents(lessonId: string): Observable<LessonContent[]> {
    return this.api.getList<LessonContent>('/lesson-contents/', { lesson_id: lessonId });
  }

  createLessonContent(content: Partial<LessonContent>): Observable<LessonContent> {
    return this.api.post<LessonContent>('/lesson-contents/', content);
  }

  updateLessonContent(id: string, content: Partial<LessonContent>): Observable<LessonContent> {
    return this.api.patch<LessonContent>(`/lesson-contents/${id}/`, content);
  }

  deleteLessonContent(id: string): Observable<void> {
    return this.api.delete<void>(`/lesson-contents/${id}/`);
  }
}
