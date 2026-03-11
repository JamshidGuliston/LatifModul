import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  StudentModuleEnrollment,
  StudentLessonProgress,
  AssignmentAttempt,
  QuestionAnswer
} from '../models/progress.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private api = inject(ApiService);

  // Enrollments
  getEnrollments(params?: Record<string, string>): Observable<StudentModuleEnrollment[]> {
    return this.api.getList<StudentModuleEnrollment>('/enrollments/', params);
  }

  createEnrollment(enrollment: Partial<StudentModuleEnrollment>): Observable<StudentModuleEnrollment> {
    return this.api.post<StudentModuleEnrollment>('/enrollments/', enrollment);
  }

  deleteEnrollment(id: string): Observable<void> {
    return this.api.delete<void>(`/enrollments/${id}/`);
  }

  // Lesson Progress
  getLessonProgress(params?: Record<string, string>): Observable<StudentLessonProgress[]> {
    return this.api.getList<StudentLessonProgress>('/lesson-progress/', params);
  }

  // Assignment Attempts
  getAttempts(params?: Record<string, string>): Observable<AssignmentAttempt[]> {
    return this.api.getList<AssignmentAttempt>('/attempts/', params);
  }

  getAttemptDetail(id: string): Observable<AssignmentAttempt & { answers: QuestionAnswer[] }> {
    return this.api.get(`/attempts/${id}/`);
  }
}
