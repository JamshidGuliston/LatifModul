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

  createLessonProgress(data: Partial<StudentLessonProgress>): Observable<StudentLessonProgress> {
    return this.api.post<StudentLessonProgress>('/lesson-progress/', data);
  }

  patchLessonProgress(id: string, data: Partial<StudentLessonProgress>): Observable<StudentLessonProgress> {
    return this.api.patch<StudentLessonProgress>(`/lesson-progress/${id}/`, data);
  }

  // Assignment Attempts
  getAttempts(params?: Record<string, string>): Observable<AssignmentAttempt[]> {
    return this.api.getList<AssignmentAttempt>('/attempts/', params);
  }

  getAttemptDetail(id: string): Observable<AssignmentAttempt & { answers: QuestionAnswer[] }> {
    return this.api.get(`/attempts/${id}/`);
  }

  createAttempt(data: { student: string; assignment: string; max_score: number }): Observable<AssignmentAttempt> {
    return this.api.post<AssignmentAttempt>('/attempts/', data);
  }

  submitAttempt(id: string): Observable<AssignmentAttempt> {
    return this.api.post<AssignmentAttempt>(`/attempts/${id}/submit/`, {});
  }

  patchAttempt(id: string, data: Partial<AssignmentAttempt>): Observable<AssignmentAttempt> {
    return this.api.patch<AssignmentAttempt>(`/attempts/${id}/`, data);
  }

  saveAnswer(data: { attempt: string; question: string; answer_data: any }): Observable<QuestionAnswer> {
    return this.api.post<QuestionAnswer>('/answers/', data);
  }

  patchAnswer(id: string, data: Partial<QuestionAnswer>): Observable<QuestionAnswer> {
    return this.api.patch<QuestionAnswer>(`/answers/${id}/`, data);
  }

  getAnswers(attemptId: string): Observable<QuestionAnswer[]> {
    return this.api.getList<QuestionAnswer>('/answers/', { attempt_id: attemptId });
  }
}
