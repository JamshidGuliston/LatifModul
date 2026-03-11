import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Assignment, AssignmentDetail, AssignmentType } from '../models/assignment.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private api = inject(ApiService);

  getAll(lessonId?: string): Observable<Assignment[]> {
    const params = lessonId ? { lesson_id: lessonId } : undefined;
    return this.api.getList<Assignment>('/assignments/', params);
  }

  getById(id: string): Observable<AssignmentDetail> {
    return this.api.get<AssignmentDetail>(`/assignments/${id}/`);
  }

  create(assignment: Partial<Assignment>): Observable<Assignment> {
    return this.api.post<Assignment>('/assignments/', assignment);
  }

  update(id: string, assignment: Partial<Assignment>): Observable<Assignment> {
    return this.api.patch<Assignment>(`/assignments/${id}/`, assignment);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/assignments/${id}/`);
  }

  getTypes(): Observable<AssignmentType[]> {
    return this.api.getList<AssignmentType>('/assignment-types/');
  }
}
