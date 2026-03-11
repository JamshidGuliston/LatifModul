import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { ProgressService } from '../../../core/services/progress.service';
import { StudentService } from '../../../core/services/student.service';
import { ModuleService } from '../../../core/services/module.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { StudentModuleEnrollment } from '../../../core/models/progress.model';
import { Student } from '../../../core/models/student.model';
import { Module } from '../../../core/models/module.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-enrollment-list',
  imports: [
    FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatCardModule,
    TranslatePipe, LoadingSpinnerComponent, DatePipe
  ],
  template: `
    <div class="page-header">
      <h2>{{ 'progress.title' | translate }}</h2>
      <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
        <mat-icon>add</mat-icon>
        {{ 'progress.addEnrollment' | translate }}
      </button>
    </div>

    @if (showForm()) {
      <mat-card class="enroll-form">
        <mat-card-content>
          <div class="row">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>{{ 'progress.student' | translate }}</mat-label>
              <mat-select [(ngModel)]="enrollForm.student">
                @for (s of students(); track s.id) {
                  <mat-option [value]="s.id">{{ s.full_name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>{{ 'progress.module' | translate }}</mat-label>
              <mat-select [(ngModel)]="enrollForm.module">
                @for (m of modules(); track m.id) {
                  <mat-option [value]="m.id">{{ m.title }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <button mat-flat-button color="primary" (click)="createEnrollment()" class="enroll-btn">
              {{ 'common.save' | translate }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    }

    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <table mat-table [dataSource]="enrollments()" class="full-width">
        <ng-container matColumnDef="student_name">
          <th mat-header-cell *matHeaderCellDef>{{ 'progress.student' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ e.student_name }}</td>
        </ng-container>

        <ng-container matColumnDef="module_title">
          <th mat-header-cell *matHeaderCellDef>{{ 'progress.module' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ e.module_title }}</td>
        </ng-container>

        <ng-container matColumnDef="progress_percent">
          <th mat-header-cell *matHeaderCellDef>{{ 'progress.percent' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ e.progress_percent }}%</td>
        </ng-container>

        <ng-container matColumnDef="enrolled_at">
          <th mat-header-cell *matHeaderCellDef>{{ 'progress.enrolledAt' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ e.enrolled_at | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="completed_at">
          <th mat-header-cell *matHeaderCellDef>{{ 'progress.completedAt' | translate }}</th>
          <td mat-cell *matCellDef="let e">{{ e.completed_at ? (e.completed_at | date:'mediumDate') : '-' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>{{ 'common.actions' | translate }}</th>
          <td mat-cell *matCellDef="let e">
            <button mat-icon-button color="primary" (click)="viewProgress(e)">
              <mat-icon>visibility</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="onDelete(e)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>

      @if (enrollments().length === 0) {
        <p class="no-data">{{ 'common.noData' | translate }}</p>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .no-data { text-align: center; color: #999; padding: 32px; }
    .enroll-form { margin-bottom: 16px; }
    .row { display: flex; gap: 16px; align-items: center; }
    .flex-1 { flex: 1; }
    .enroll-btn { height: 56px; }
  `]
})
export class EnrollmentListComponent implements OnInit {
  private router = inject(Router);
  private progressService = inject(ProgressService);
  private studentService = inject(StudentService);
  private moduleService = inject(ModuleService);
  private teacherService = inject(TeacherService);
  private dialog = inject(MatDialog);
  private lang = inject(LanguageService);

  loading = signal(true);
  enrollments = signal<StudentModuleEnrollment[]>([]);
  students = signal<Student[]>([]);
  modules = signal<Module[]>([]);
  showForm = signal(false);
  enrollForm = { student: '', module: '' };
  columns = ['student_name', 'module_title', 'progress_percent', 'enrolled_at', 'completed_at', 'actions'];

  ngOnInit(): void {
    this.loadEnrollments();
    const teacher = this.teacherService.getCurrentTeacher();
    this.studentService.getAll(teacher?.id).subscribe(s => this.students.set(s));
    this.moduleService.getAll(teacher?.id).subscribe(m => this.modules.set(m));
  }

  loadEnrollments(): void {
    this.progressService.getEnrollments().subscribe({
      next: (data) => { this.enrollments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  createEnrollment(): void {
    if (!this.enrollForm.student || !this.enrollForm.module) return;
    this.progressService.createEnrollment(this.enrollForm).subscribe({
      next: () => {
        this.showForm.set(false);
        this.enrollForm = { student: '', module: '' };
        this.loadEnrollments();
      }
    });
  }

  viewProgress(enrollment: StudentModuleEnrollment): void {
    this.router.navigate(['/progress', 'student', enrollment.student], {
      queryParams: { module_id: enrollment.module }
    });
  }

  onDelete(enrollment: StudentModuleEnrollment): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: this.lang.t('dialog.confirmTitle'), message: this.lang.t('progress.deleteConfirm') }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.progressService.deleteEnrollment(enrollment.id).subscribe(() => this.loadEnrollments());
      }
    });
  }
}
