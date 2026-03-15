import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { ModuleService } from '../../../core/services/module.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Module } from '../../../core/models/module.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-module-list',
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    TranslatePipe, StripHtmlPipe, LoadingSpinnerComponent
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>library_books</mat-icon>
          </div>
          <div class="header-text">
            <h1>{{ 'modules.title' | translate }}</h1>
            <p>{{ modules().length }} ta modul</p>
          </div>
        </div>
        <button class="add-btn" (click)="router.navigate(['/modules/new'])">
          <mat-icon>add</mat-icon>
          {{ 'modules.add' | translate }}
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        @if (modules().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <mat-icon>library_add</mat-icon>
            </div>
            <h3>{{ 'common.noData' | translate }}</h3>
            <p>Modullar ro'yxati bo'sh</p>
            <button class="add-btn" (click)="router.navigate(['/modules/new'])">
              <mat-icon>add</mat-icon>
              {{ 'modules.add' | translate }}
            </button>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="modules()" class="modern-table">
              <!-- Thumbnail & Title Column -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>{{ 'common.title' | translate }}</th>
                <td mat-cell *matCellDef="let mod">
                  <div class="module-cell">
                    <div class="module-thumbnail" [style.background-image]="mod.thumbnail ? 'url(' + mod.thumbnail + ')' : ''">
                      @if (!mod.thumbnail) {
                        <mat-icon>library_books</mat-icon>
                      }
                    </div>
                    <div class="module-info">
                      <span class="module-title">{{ mod.title }}</span>
                      <span class="module-desc">{{ (mod.description | stripHtml) || "Tavsif yo'q" }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Stats Column -->
              <ng-container matColumnDef="stats">
                <th mat-header-cell *matHeaderCellDef>{{ 'modules.lessons' | translate }}</th>
                <td mat-cell *matCellDef="let mod">
                  <div class="stats-cell">
                    <mat-icon>menu_book</mat-icon>
                    <span>{{ mod.lessons_count || 0 }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="is_published">
                <th mat-header-cell *matHeaderCellDef>{{ 'common.status' | translate }}</th>
                <td mat-cell *matCellDef="let mod">
                  <span class="status-badge" [class.published]="mod.is_published" [class.draft]="!mod.is_published">
                    <span class="status-dot"></span>
                    {{ (mod.is_published ? 'common.published' : 'common.unpublished') | translate }}
                  </span>
                </td>
              </ng-container>

              <!-- Order Column -->
              <ng-container matColumnDef="order">
                <th mat-header-cell *matHeaderCellDef>{{ 'common.order' | translate }}</th>
                <td mat-cell *matCellDef="let mod">
                  <span class="order-badge">#{{ mod.order }}</span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>{{ 'common.actions' | translate }}</th>
                <td mat-cell *matCellDef="let mod">
                  <div class="action-btns">
                    <button class="action-btn lessons" (click)="router.navigate(['/modules', mod.id, 'lessons'])" matTooltip="Darslar">
                      <mat-icon>list</mat-icon>
                    </button>
                    <button class="action-btn edit" (click)="router.navigate(['/modules', mod.id])">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button class="action-btn delete" (click)="onDelete(mod)">
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

    /* Table Styles */
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

    .module-cell {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .module-thumbnail {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--primary-400);
      }
    }

    .module-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .module-title {
      font-weight: 600;
      color: var(--gray-900);
      font-size: 0.95rem;
    }

    .module-desc {
      font-size: 0.85rem;
      color: var(--gray-500);
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

    .order-badge {
      display: inline-block;
      padding: 4px 8px;
      background: var(--gray-100);
      border-radius: var(--radius);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--gray-600);
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

      &.lessons {
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

      .add-btn {
        justify-content: center;
      }
    }
  `]
})
export class ModuleListComponent implements OnInit {
  router = inject(Router);
  private moduleService = inject(ModuleService);
  private teacherService = inject(TeacherService);
  private dialog = inject(MatDialog);
  private lang = inject(LanguageService);

  loading = signal(true);
  modules = signal<Module[]>([]);
  columns = ['order', 'title', 'stats', 'is_published', 'actions'];

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(): void {
    const teacher = this.teacherService.getCurrentTeacher();
    this.moduleService.getAll(teacher?.id).subscribe({
      next: (data) => { this.modules.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onDelete(mod: Module): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.lang.t('dialog.confirmTitle'),
        message: this.lang.t('modules.deleteConfirm')
      }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.moduleService.delete(mod.id).subscribe(() => this.loadModules());
      }
    });
  }
}
