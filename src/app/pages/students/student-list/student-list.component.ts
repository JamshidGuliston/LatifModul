import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { StudentService } from '../../../core/services/student.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Student } from '../../../core/models/student.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LanguageService } from '../../../core/services/language.service';
import { DatePipe, LowerCasePipe } from '@angular/common';

@Component({
  selector: 'app-student-list',
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    TranslatePipe, LoadingSpinnerComponent, DatePipe, LowerCasePipe
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>people</mat-icon>
          </div>
          <div class="header-text">
            <h1>{{ 'students.title' | translate }}</h1>
            <p>{{ students().length }} {{ 'students.title' | translate | lowercase }}</p>
          </div>
        </div>
        <button class="add-btn" (click)="router.navigate(['/students/new'])">
          <mat-icon>add</mat-icon>
          {{ 'students.add' | translate }}
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        @if (students().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <mat-icon>person_add</mat-icon>
            </div>
            <h3>{{ 'common.noData' | translate }}</h3>
            <p>Talabalar ro'yxati bo'sh</p>
            <button class="add-btn" (click)="router.navigate(['/students/new'])">
              <mat-icon>add</mat-icon>
              {{ 'students.add' | translate }}
            </button>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="students()" class="modern-table">
              <ng-container matColumnDef="full_name">
                <th mat-header-cell *matHeaderCellDef>{{ 'students.name' | translate }}</th>
                <td mat-cell *matCellDef="let s">
                  <div class="user-cell">
                    <div class="user-avatar">
                      {{ s.full_name.charAt(0).toUpperCase() }}
                    </div>
                    <span class="user-name">{{ s.full_name }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>{{ 'students.email' | translate }}</th>
                <td mat-cell *matCellDef="let s">
                  <span class="email-text">{{ s.email }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="is_active">
                <th mat-header-cell *matHeaderCellDef>{{ 'students.status' | translate }}</th>
                <td mat-cell *matCellDef="let s">
                  <span class="status-badge" [class.active]="s.is_active" [class.inactive]="!s.is_active">
                    <span class="status-dot"></span>
                    {{ (s.is_active ? 'common.active' : 'common.inactive') | translate }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef>{{ 'students.createdAt' | translate }}</th>
                <td mat-cell *matCellDef="let s">
                  <span class="date-text">{{ s.created_at | date:'mediumDate' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>{{ 'common.actions' | translate }}</th>
                <td mat-cell *matCellDef="let s">
                  <div class="action-btns">
                    <button class="action-btn edit" (click)="router.navigate(['/students', s.id, 'edit'])">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button class="action-btn delete" (click)="onDelete(s)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container {
      animation: fadeIn 0.5s ease-out;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: var(--white);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--gray-100);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }
    }

    .header-text {
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--gray-900);
        margin: 0;
      }

      p {
        font-size: 0.9rem;
        color: var(--gray-500);
        margin: 4px 0 0;
      }
    }

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      background: var(--white);
      border-radius: var(--radius-xl);
      border: 2px dashed var(--gray-200);

      .empty-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        background: var(--gray-100);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: var(--gray-400);
        }
      }

      h3 {
        font-size: 1.25rem;
        color: var(--gray-700);
        margin: 0 0 8px;
      }

      p {
        color: var(--gray-500);
        margin: 0 0 24px;
      }
    }

    .table-container {
      background: var(--white);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--gray-100);
      overflow: hidden;
    }

    .modern-table {
      width: 100%;

      th {
        font-weight: 600;
        color: var(--gray-600);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: var(--gray-50);
        padding: 16px 20px;
        border-bottom: 1px solid var(--gray-200);
      }

      td {
        padding: 16px 20px;
        border-bottom: 1px solid var(--gray-100);
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background: var(--primary-50);
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1rem;
    }

    .user-name {
      font-weight: 600;
      color: var(--gray-900);
    }

    .email-text {
      color: var(--gray-600);
    }

    .date-text {
      color: var(--gray-500);
      font-size: 0.9rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 500;

      &.active {
        background: var(--success-light);
        color: var(--success);

        .status-dot {
          background: var(--success);
        }
      }

      &.inactive {
        background: var(--gray-100);
        color: var(--gray-600);

        .status-dot {
          background: var(--gray-400);
        }
      }
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .action-btns {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &.edit {
        background: var(--primary-50);
        color: var(--primary-600);

        &:hover {
          background: var(--primary-100);
          transform: scale(1.1);
        }
      }

      &.delete {
        background: var(--error-light);
        color: var(--error);

        &:hover {
          background: #fecaca;
          transform: scale(1.1);
        }
      }
    }
  `]
})
export class StudentListComponent implements OnInit {
  router = inject(Router);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);
  private dialog = inject(MatDialog);
  private lang = inject(LanguageService);

  loading = signal(true);
  students = signal<Student[]>([]);
  columns = ['full_name', 'email', 'is_active', 'created_at', 'actions'];

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    const teacher = this.teacherService.getCurrentTeacher();
    this.studentService.getAll(teacher?.id).subscribe({
      next: (data) => { this.students.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onDelete(student: Student): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.lang.t('dialog.confirmTitle'),
        message: this.lang.t('students.deleteConfirm')
      }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.studentService.delete(student.id).subscribe(() => this.loadStudents());
      }
    });
  }
}
