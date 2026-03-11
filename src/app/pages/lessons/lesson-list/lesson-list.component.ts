import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LowerCasePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { LessonService } from '../../../core/services/lesson.service';
import { ModuleService } from '../../../core/services/module.service';
import { Lesson } from '../../../core/models/lesson.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-lesson-list',
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    TranslatePipe, LowerCasePipe, LoadingSpinnerComponent
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <button class="back-btn" (click)="router.navigate(['/modules'])" type="button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-icon">
            <mat-icon>menu_book</mat-icon>
          </div>
          <div class="header-text">
            <h1>{{ moduleTitle() }}</h1>
            <p>{{ lessons().length }} {{ 'lessons.title' | translate | lowercase }}</p>
          </div>
        </div>
        <button class="add-btn" (click)="addLesson()">
          <mat-icon>add</mat-icon>
          {{ 'lessons.add' | translate }}
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        @if (lessons().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <mat-icon>book</mat-icon>
            </div>
            <h3>{{ 'common.noData' | translate }}</h3>
            <p>Ushbu modulda hozircha darslar yo'q</p>
            <button class="add-btn" (click)="addLesson()">
              <mat-icon>add</mat-icon>
              {{ 'lessons.add' | translate }}
            </button>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="lessons()" class="modern-table">
              <!-- Order Column -->
              <ng-container matColumnDef="order_index">
                <th mat-header-cell *matHeaderCellDef>{{ 'common.order' | translate }}</th>
                <td mat-cell *matCellDef="let l">
                  <span class="order-badge">#{{ l.order_index }}</span>
                </td>
              </ng-container>

              <!-- Title Column -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>{{ 'common.title' | translate }}</th>
                <td mat-cell *matCellDef="let l">
                  <span class="lesson-title">{{ l.title }}</span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="is_published">
                <th mat-header-cell *matHeaderCellDef>{{ 'common.status' | translate }}</th>
                <td mat-cell *matCellDef="let l">
                  <span class="status-badge" [class.published]="l.is_published" [class.draft]="!l.is_published">
                    <span class="status-dot"></span>
                    {{ (l.is_published ? 'common.published' : 'common.unpublished') | translate }}
                  </span>
                </td>
              </ng-container>

              <!-- Assignments Count Column -->
              <ng-container matColumnDef="assignments_count">
                <th mat-header-cell *matHeaderCellDef>{{ 'lessons.assignmentsCount' | translate }}</th>
                <td mat-cell *matCellDef="let l">
                  <div class="stats-cell">
                    <mat-icon>assignment</mat-icon>
                    <span>{{ l.assignments_count || 0 }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>{{ 'common.actions' | translate }}</th>
                <td mat-cell *matCellDef="let l">
                  <div class="action-btns">
                    <button class="action-btn assignments" (click)="router.navigate(['/lessons', l.id, 'assignments'])" matTooltip="Vazifalar">
                      <mat-icon>assignment</mat-icon>
                    </button>
                    <button class="action-btn edit" (click)="router.navigate(['/lessons', l.id, 'edit'])">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button class="action-btn delete" (click)="onDelete(l)">
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

    .back-btn {
      width: 44px;
      height: 44px;
      border: none;
      background: var(--gray-100);
      border-radius: var(--radius);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gray-600);
      transition: all var(--transition);

      &:hover {
        background: var(--gray-200);
        color: var(--gray-800);
        transform: translateX(-4px);
      }
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);

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
        background: var(--primary-50);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: var(--primary-400);
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
        padding: 16px 24px;
        border-bottom: 1px solid var(--gray-200);
      }

      td {
        padding: 16px 24px;
        border-bottom: 1px solid var(--gray-100);
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background: var(--primary-50);
      }
    }

    .lesson-title {
      font-weight: 600;
      color: var(--gray-900);
      font-size: 0.95rem;
    }

    .order-badge {
      display: inline-block;
      padding: 4px 8px;
      background: var(--gray-100);
      border-radius: var(--radius);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--gray-600);
    }

    .stats-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--gray-600);
      font-weight: 500;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--gray-400);
      }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 500;

      &.published {
        background: var(--success-light);
        color: var(--success);

        .status-dot {
          background: var(--success);
        }
      }

      &.draft {
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
      justify-content: flex-end;
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

      &.assignments {
        background: var(--primary-50);
        color: var(--primary-600);

        &:hover {
          background: var(--primary-100);
          transform: scale(1.1);
        }
      }

      &.edit {
        background: var(--gray-100);
        color: var(--gray-600);

        &:hover {
          background: var(--gray-200);
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

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
    }
  `]
})
export class LessonListComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private lessonService = inject(LessonService);
  private moduleService = inject(ModuleService);
  private dialog = inject(MatDialog);
  private lang = inject(LanguageService);

  loading = signal(true);
  lessons = signal<Lesson[]>([]);
  moduleId = '';
  moduleTitle = signal('');
  columns = ['order_index', 'title', 'is_published', 'assignments_count', 'actions'];

  ngOnInit(): void {
    // Check both params and queryParams for module_id
    this.moduleId = this.route.snapshot.params['id'] || this.route.snapshot.queryParams['module_id'];
    this.loadLessons();

    if (this.moduleId) {
      this.moduleService.getById(this.moduleId).subscribe({
        next: (mod) => this.moduleTitle.set(mod.title),
        error: () => this.moduleTitle.set(this.lang.t('lessons.title'))
      });
    } else {
      this.moduleTitle.set(this.lang.t('lessons.title'));
    }
  }

  loadLessons(): void {
    this.lessonService.getAll(this.moduleId).subscribe({
      next: (data) => { this.lessons.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  addLesson(): void {
    this.router.navigate(['/lessons', 'new'], { queryParams: { module_id: this.moduleId } });
  }

  onDelete(lesson: Lesson): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: this.lang.t('dialog.confirmTitle'), message: this.lang.t('lessons.deleteConfirm') }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.lessonService.delete(lesson.id).subscribe(() => this.loadLessons());
      }
    });
  }
}

