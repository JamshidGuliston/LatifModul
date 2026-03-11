import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Question } from '../models/question.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private api = inject(ApiService);

  getAll(assignmentId?: string): Observable<Question[]> {
    const params = assignmentId ? { assignment_id: assignmentId } : undefined;
    return this.api.getList<Question>('/questions/', params);
  }

  getById(id: string): Observable<Question> {
    return this.api.get<Question>(`/questions/${id}/`);
  }

  create(question: Partial<Question>): Observable<Question> {
    return this.api.post<Question>('/questions/', question);
  }

  update(id: string, question: Partial<Question>): Observable<Question> {
    return this.api.patch<Question>(`/questions/${id}/`, question);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/questions/${id}/`);
  }
}
