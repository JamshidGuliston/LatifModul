import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Module, ModuleDetail } from '../models/module.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private api = inject(ApiService);

  getAll(teacherId?: string): Observable<Module[]> {
    const params = teacherId ? { teacher_id: teacherId } : undefined;
    return this.api.getList<Module>('/modules/', params);
  }

  getById(id: string): Observable<ModuleDetail> {
    return this.api.get<ModuleDetail>(`/modules/${id}/`);
  }

  create(mod: Partial<Module>): Observable<Module> {
    return this.api.post<Module>('/modules/', mod);
  }

  update(id: string, mod: Partial<Module>): Observable<Module> {
    return this.api.patch<Module>(`/modules/${id}/`, mod);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/modules/${id}/`);
  }
}
