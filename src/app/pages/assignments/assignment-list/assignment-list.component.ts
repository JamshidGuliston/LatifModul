import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AssignmentService } from '../../../core/services/assignment.service';
import { LessonService } from '../../../core/services/lesson.service';
import { Assignment, AssignmentType } from '../../../core/models/assignment.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-assignment-list',
  imports: [MatIconModule, TranslatePipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-icon purple">
            <mat-icon>assignment</mat-icon>
          </div>
          <div class="header-text">
            <div class="breadcrumb">
              <span class="bc-link" (click)="goBack()">{{ lessonTitle() }}</span>
              <mat-icon class="bc-sep">chevron_right</mat-icon>
              <span>Vazifalar</span>
            </div>
            <h1>{{ 'assignments.title' | translate }}</h1>
          </div>
        </div>
        <button class="add-btn" (click)="addAssignment()">
          <mat-icon>add</mat-icon>
          {{ 'assignments.add' | translate }}
        </button>
      </div>

      @if (loading()) {
        <!-- Skeleton -->
        <div class="summary-bar">
          @for (i of [1,2,3,4]; track i) {
            <div class="sb-skeleton"></div>
          }
        </div>
        <div class="assignments-grid">
          @for (i of [1,2,3]; track i) {
            <div class="card-skeleton">
              <div class="sk sk-top"></div>
              <div class="sk-body">
                <div class="sk sk-title"></div>
                <div class="sk sk-desc"></div>
                <div class="sk sk-tags"></div>
              </div>
              <div class="sk sk-footer"></div>
            </div>
          }
        </div>
      } @else {

        <!-- Empty -->
        @if (assignments().length === 0) {
          <div class="empty-state">
            <div class="empty-illu">
              <div class="ei-ring r1"></div>
              <div class="ei-ring r2"></div>
              <div class="ei-icon">
                <mat-icon>assignment</mat-icon>
              </div>
            </div>
            <h3>Hozircha vazifalar yo'q</h3>
            <p>Bu dars uchun birinchi vazifani yarating va talabalarni sinab ko'ring</p>
            <button class="add-btn" (click)="addAssignment()">
              <mat-icon>add</mat-icon>
              Birinchi vazifani yarating
            </button>
          </div>
        } @else {

          <!-- Summary Bar -->
          <div class="summary-bar">
            <div class="sb-item">
              <div class="sb-icon-wrap purple">
                <mat-icon>assignment</mat-icon>
              </div>
              <div class="sb-info">
                <span class="sb-num">{{ assignments().length }}</span>
                <span class="sb-lbl">Jami vazifalar</span>
              </div>
              <div class="sb-chart">
                <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#ede9fe" stroke-width="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8b5cf6" stroke-width="3"
                  [attr.stroke-dasharray]="publishedPercent + ' 100'" stroke-linecap="round"
                  transform="rotate(-90 18 18)"/>
                </svg>
                <span>{{ publishedPercent }}%</span>
              </div>
            </div>
            <div class="sb-item">
              <div class="sb-icon-wrap green">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="sb-info">
                <span class="sb-num">{{ publishedCount }}</span>
                <span class="sb-lbl">Faol / {{ assignments().length - publishedCount }} qoralama</span>
              </div>
            </div>
            <div class="sb-item">
              <div class="sb-icon-wrap orange">
                <mat-icon>quiz</mat-icon>
              </div>
              <div class="sb-info">
                <span class="sb-num">{{ totalQuestions }}</span>
                <span class="sb-lbl">Jami savollar</span>
              </div>
            </div>
            <div class="sb-item">
              <div class="sb-icon-wrap blue">
                <mat-icon>stars</mat-icon>
              </div>
              <div class="sb-info">
                <span class="sb-num">{{ totalPoints }}</span>
                <span class="sb-lbl">Umumiy ball</span>
              </div>
            </div>
          </div>

          <!-- Cards Grid -->
          <div class="assignments-grid">
            @for (a of assignments(); track a.id; let i = $index) {
              <div class="assignment-card" [class.published]="a.is_published"
                   [style.animation-delay]="(i * 0.07) + 's'">

                <!-- Top stripe -->
                <div class="card-stripe" [class.pub-stripe]="a.is_published"></div>

                <!-- Card Header -->
                <div class="ac-header">
                  <div class="ac-left">
                    <div class="ac-index">{{ i + 1 }}</div>
                    @if (getTypeName(a.assignment_type)) {
                      <span class="type-badge">
                        <mat-icon>{{ getTypeIcon(a.assignment_type) }}</mat-icon>
                        {{ getTypeName(a.assignment_type) }}
                      </span>
                    }
                  </div>
                  <!-- Publish Toggle -->
                  <button class="toggle-pub" [class.active]="a.is_published"
                          (click)="togglePublish(a)" [disabled]="toggling === a.id">
                    @if (toggling === a.id) {
                      <div class="mini-spin"></div>
                    } @else {
                      <mat-icon>{{ a.is_published ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                    }
                    {{ a.is_published ? 'Faol' : 'Yashirin' }}
                  </button>
                </div>

                <!-- Card Body -->
                <div class="ac-body">
                  <h3 class="ac-title">{{ a.title }}</h3>
                  @if (a.description) {
                    <p class="ac-desc">{{ a.description }}</p>
                  }
                </div>

                <!-- Stats row -->
                <div class="ac-stats">
                  <div class="ac-stat" [class.highlight]="(a.questions_count || 0) > 0">
                    <mat-icon>quiz</mat-icon>
                    <span>{{ a.questions_count || 0 }} savol</span>
                  </div>
                  <div class="ac-stat highlight-blue">
                    <mat-icon>stars</mat-icon>
                    <span>{{ a.total_points }} ball</span>
                  </div>
                  @if (a.time_limit) {
                    <div class="ac-stat">
                      <mat-icon>timer</mat-icon>
                      <span>{{ a.time_limit }} min</span>
                    </div>
                  } @else {
                    <div class="ac-stat muted">
                      <mat-icon>timer_off</mat-icon>
                      <span>Cheksiz</span>
                    </div>
                  }
                  <div class="ac-stat">
                    <mat-icon>repeat</mat-icon>
                    <span>{{ a.attempts_allowed }}x</span>
                  </div>
                </div>

                <!-- Progress bar (questions) -->
                @if ((a.questions_count || 0) > 0) {
                  <div class="ac-progress">
                    <div class="acp-bar">
                      <div class="acp-fill"
                           [style.width]="getQuestionsPercent(a.questions_count) + '%'"></div>
                    </div>
                    <span class="acp-label">{{ a.questions_count }}/{{ maxQuestions }} savol</span>
                  </div>
                }

                <!-- Actions -->
                <div class="ac-actions">
                  <button class="ac-btn questions" (click)="openQuestions(a)">
                    <mat-icon>quiz</mat-icon>
                    <span>Savollar</span>
                    @if ((a.questions_count || 0) > 0) {
                      <span class="q-count">{{ a.questions_count }}</span>
                    }
                  </button>
                  <button class="ac-btn icon-btn" title="Tahrirlash"
                          (click)="router.navigate(['/assignments', a.id, 'edit'])">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="ac-btn icon-btn duplicate" title="Nusxalash"
                          (click)="duplicateAssignment(a)" [disabled]="duplicating === a.id">
                    @if (duplicating === a.id) {
                      <div class="mini-spin dark"></div>
                    } @else {
                      <mat-icon>content_copy</mat-icon>
                    }
                  </button>
                  <button class="ac-btn icon-btn danger" title="O'chirish"
                          (click)="onDelete(a)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

              </div>
            }

            <!-- Add card -->
            <div class="add-card" (click)="addAssignment()">
              <div class="add-card-icon">
                <mat-icon>add</mat-icon>
              </div>
              <span>Yangi vazifa qo'shish</span>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { animation: fadeIn 0.4s ease-out; }

    /* ===== HEADER ===== */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid var(--gray-100);
    }

    .header-left { display: flex; align-items: center; gap: 16px; }

    .back-btn {
      width: 42px; height: 42px;
      border: none; background: var(--gray-100);
      border-radius: 12px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--gray-600); transition: all 0.2s;
      &:hover { background: var(--gray-200); transform: translateX(-3px); }
    }

    .header-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 26px; width: 26px; height: 26px; color: white; }
      &.purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); box-shadow: 0 6px 20px rgba(124,58,237,0.3); }
    }

    .header-text {
      .breadcrumb {
        display: flex; align-items: center; gap: 4px;
        font-size: 0.8rem; color: var(--gray-400); margin-bottom: 4px;
        .bc-link { color: var(--primary-500); cursor: pointer; &:hover { text-decoration: underline; } }
        .bc-sep { font-size: 16px; width: 16px; height: 16px; }
      }
      h1 { font-size: 1.4rem; font-weight: 800; color: var(--gray-900); margin: 0; }
    }

    .add-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 22px;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      color: white; border: none; border-radius: 12px;
      font-size: 0.9rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s; box-shadow: 0 4px 14px rgba(109,40,217,0.3);
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(109,40,217,0.4); }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    /* ===== SKELETON ===== */
    .sb-skeleton {
      height: 88px; background: white; border-radius: 16px;
      border: 1px solid var(--gray-100);
      background: linear-gradient(90deg, #f3f4f6 25%, #f9fafb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .card-skeleton {
      background: white; border-radius: 18px;
      border: 1px solid var(--gray-100); overflow: hidden;
    }

    .sk {
      background: linear-gradient(90deg, #f3f4f6 25%, #f9fafb 50%, #f3f4f6 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }
    .sk-top { height: 52px; border-radius: 0; }
    .sk-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .sk-title { height: 20px; width: 75%; }
    .sk-desc { height: 14px; width: 55%; }
    .sk-tags { height: 28px; width: 50%; }
    .sk-footer { height: 44px; margin: 0; border-radius: 0; }

    /* ===== SUMMARY BAR ===== */
    .summary-bar {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; margin-bottom: 24px;
    }

    .sb-item {
      background: white; border-radius: 16px;
      padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      position: relative; overflow: hidden;
    }

    .sb-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; color: white; }
      &.purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); box-shadow: 0 4px 12px rgba(124,58,237,0.25); }
      &.green  { background: linear-gradient(135deg, #34d399, #059669); box-shadow: 0 4px 12px rgba(5,150,105,0.25); }
      &.orange { background: linear-gradient(135deg, #fbbf24, #d97706); box-shadow: 0 4px 12px rgba(217,119,6,0.25); }
      &.blue   { background: linear-gradient(135deg, #60a5fa, #2563eb); box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
    }

    .sb-info { flex: 1; }
    .sb-num { display: block; font-size: 1.6rem; font-weight: 800; color: var(--gray-900); line-height: 1; }
    .sb-lbl { font-size: 0.75rem; color: var(--gray-500); font-weight: 500; }

    .sb-chart {
      position: relative; width: 40px; height: 40px; flex-shrink: 0;
      svg { width: 40px; height: 40px; }
      span {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.6rem; font-weight: 700; color: #7c3aed;
      }
    }

    /* ===== CARDS GRID ===== */
    .assignments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    /* Assignment Card */
    .assignment-card {
      background: white; border-radius: 18px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      overflow: hidden; display: flex; flex-direction: column;
      opacity: 0; animation: fadeInUp 0.5s ease-out forwards;
      transition: all 0.22s;
      position: relative;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 18px 40px rgba(0,0,0,0.1);
        border-color: #ddd6fe;
      }

      &.published {
        border-color: #bbf7d0;
        &:hover { border-color: #6ee7b7; }
      }
    }

    .card-stripe {
      height: 3px;
      background: var(--gray-200);
      &.pub-stripe { background: linear-gradient(90deg, #10b981, #34d399); }
    }

    /* Card Header */
    .ac-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px;
      border-bottom: 1px solid var(--gray-50);
    }

    .ac-left { display: flex; align-items: center; gap: 10px; }

    .ac-index {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 800; color: #7c3aed;
    }

    .type-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.75rem; font-weight: 600;
      background: #f3f4f6; color: var(--gray-600);
      border: 1px solid var(--gray-200);
      padding: 3px 10px; border-radius: 100px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    /* Publish Toggle */
    .toggle-pub {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 11px;
      border: 1px solid var(--gray-200);
      background: var(--gray-50);
      color: var(--gray-500);
      border-radius: 100px; font-size: 0.75rem; font-weight: 600;
      cursor: pointer; transition: all 0.18s;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &.active {
        background: #dcfce7; color: #16a34a; border-color: #bbf7d0;
        mat-icon { color: #16a34a; }
      }

      &:hover:not(.active) { background: var(--gray-100); }
      &:hover.active { background: #bbf7d0; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .mini-spin {
      width: 14px; height: 14px;
      border: 2px solid rgba(109,40,217,0.2);
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      &.dark {
        border-color: rgba(0,0,0,0.1);
        border-top-color: var(--gray-600);
      }
    }

    /* Card Body */
    .ac-body {
      padding: 14px 16px; flex: 1;
      .ac-title {
        font-size: 1rem; font-weight: 700; color: var(--gray-900);
        margin: 0 0 6px; line-height: 1.35;
      }
      .ac-desc {
        font-size: 0.82rem; color: var(--gray-500); line-height: 1.5; margin: 0;
        display: -webkit-box; -webkit-line-clamp: 2;
        -webkit-box-orient: vertical; overflow: hidden;
      }
    }

    /* Stats */
    .ac-stats {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 0 16px 10px;
    }

    .ac-stat {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.75rem; font-weight: 600;
      color: var(--gray-500); background: var(--gray-50);
      border: 1px solid var(--gray-100);
      padding: 4px 10px; border-radius: 100px;
      transition: all 0.15s;

      mat-icon { font-size: 13px; width: 13px; height: 13px; color: var(--gray-400); }

      &.highlight { background: #fef9c3; color: #a16207; border-color: #fde68a;
        mat-icon { color: #ca8a04; } }
      &.highlight-blue { background: #dbeafe; color: #1e40af; border-color: #bfdbfe;
        mat-icon { color: #3b82f6; } }
      &.muted { opacity: 0.55; }
    }

    /* Progress */
    .ac-progress {
      display: flex; align-items: center; gap: 10px;
      padding: 0 16px 12px;
    }

    .acp-bar {
      flex: 1; height: 5px; background: var(--gray-100);
      border-radius: 100px; overflow: hidden;
    }

    .acp-fill {
      height: 100%; border-radius: 100px;
      background: linear-gradient(90deg, #a78bfa, #7c3aed);
      transition: width 0.8s ease-out;
    }

    .acp-label { font-size: 0.72rem; color: var(--gray-400); font-weight: 500; flex-shrink: 0; }

    /* Actions */
    .ac-actions {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px;
      background: var(--gray-50); border-top: 1px solid var(--gray-100);
    }

    .ac-btn {
      display: inline-flex; align-items: center; gap: 6px;
      border: none; border-radius: 10px; cursor: pointer;
      font-size: 0.82rem; font-weight: 600;
      transition: all 0.18s; padding: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }

      &.questions {
        flex: 1; padding: 8px 12px;
        background: linear-gradient(135deg, #ede9fe, #ddd6fe);
        color: #7c3aed; border: 1px solid #ddd6fe;
        justify-content: center;
        &:hover { background: linear-gradient(135deg, #ddd6fe, #c4b5fd); transform: translateY(-1px); }
        .q-count {
          background: #7c3aed; color: white;
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.68rem; font-weight: 800;
        }
      }

      &.icon-btn {
        width: 34px; height: 34px;
        background: var(--gray-100); color: var(--gray-600);
        justify-content: center;
        &:hover { background: var(--gray-200); transform: scale(1.08); }
        &.duplicate:hover { background: #dbeafe; color: #2563eb; }
        &.danger { background: #fff1f2; color: #e11d48;
          &:hover { background: #ffe4e6; transform: scale(1.08); }
        }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }

    /* Add Card */
    .add-card {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px;
      padding: 32px 20px;
      background: white; border: 2px dashed #ddd6fe;
      border-radius: 18px; cursor: pointer;
      transition: all 0.2s; color: #8b5cf6;
      min-height: 180px;

      &:hover {
        background: #faf5ff; border-color: #a78bfa;
        transform: translateY(-3px);
        box-shadow: 0 10px 28px rgba(139,92,246,0.12);
      }

      span { font-size: 0.9rem; font-weight: 600; }
    }

    .add-card-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      border-radius: 50%; display: flex;
      align-items: center; justify-content: center;
      border: 2px solid #ddd6fe;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #7c3aed; }
    }

    /* Empty */
    .empty-state {
      text-align: center; padding: 80px 24px;
      background: white; border-radius: 20px;
      border: 2px dashed #ddd6fe;
    }

    .empty-illu {
      position: relative; width: 100px; height: 100px;
      margin: 0 auto 24px; display: flex;
      align-items: center; justify-content: center;
    }

    .ei-ring {
      position: absolute; border-radius: 50%;
      border: 2px solid #ddd6fe;
      &.r1 { width: 100px; height: 100px; animation: spin 10s linear infinite; }
      &.r2 { width: 75px; height: 75px; animation: spin 7s linear infinite reverse; }
    }

    .ei-icon {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      border-radius: 50%; display: flex;
      align-items: center; justify-content: center;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #7c3aed; }
    }

    .empty-state h3 { font-size: 1.2rem; font-weight: 700; color: var(--gray-800); margin: 0 0 8px; }
    .empty-state p { color: var(--gray-500); margin: 0 0 28px; font-size: 0.9rem; max-width: 320px; margin-left: auto; margin-right: auto; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 14px; align-items: stretch; }
      .summary-bar { grid-template-columns: repeat(2, 1fr); }
      .assignments-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AssignmentListComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private assignmentService = inject(AssignmentService);
  private lessonService = inject(LessonService);
  private dialog = inject(MatDialog);
  private lang = inject(LanguageService);

  loading = signal(true);
  assignments = signal<Assignment[]>([]);
  assignmentTypes = signal<AssignmentType[]>([]);
  lessonId = '';
  lessonTitle = signal('');
  moduleId = '';
  toggling: string | null = null;
  duplicating: string | null = null;

  get publishedCount(): number {
    return this.assignments().filter(a => a.is_published).length;
  }

  get publishedPercent(): number {
    if (!this.assignments().length) return 0;
    return Math.round((this.publishedCount / this.assignments().length) * 100);
  }

  get totalQuestions(): number {
    return this.assignments().reduce((s, a) => s + (a.questions_count || 0), 0);
  }

  get totalPoints(): number {
    return this.assignments().reduce((s, a) => s + (a.total_points || 0), 0);
  }

  get maxQuestions(): number {
    return Math.max(...this.assignments().map(a => a.questions_count || 0), 1);
  }

  getQuestionsPercent(count: number = 0): number {
    return Math.round((count / this.maxQuestions) * 100);
  }

  getTypeName(typeId: string): string {
    const t = this.assignmentTypes().find(t => t.id === typeId);
    return t?.name || '';
  }

  getTypeIcon(typeId: string): string {
    const name = this.getTypeName(typeId).toLowerCase();
    if (name.includes('test') || name.includes('quiz')) return 'quiz';
    if (name.includes('homework') || name.includes('uy')) return 'home';
    if (name.includes('exam') || name.includes('imtihon')) return 'school';
    if (name.includes('practice') || name.includes('amaliy')) return 'build';
    return 'assignment';
  }

  ngOnInit(): void {
    this.lessonId = this.route.snapshot.params['id'];
    this.loadAssignments();
    this.lessonService.getById(this.lessonId).subscribe(lesson => {
      this.lessonTitle.set(lesson.title);
      this.moduleId = lesson.module;
    });
    this.assignmentService.getTypes().subscribe(types => this.assignmentTypes.set(types));
  }

  loadAssignments(): void {
    this.assignmentService.getAll(this.lessonId).subscribe({
      next: (data) => { this.assignments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  addAssignment(): void {
    this.router.navigate(['/assignments', 'new'], { queryParams: { lesson_id: this.lessonId } });
  }

  openQuestions(a: Assignment): void {
    this.router.navigate(['/assignments', a.id, 'questions']);
  }

  togglePublish(a: Assignment): void {
    this.toggling = a.id;
    this.assignmentService.update(a.id, { is_published: !a.is_published }).subscribe({
      next: () => {
        this.assignments.update(list =>
          list.map(item => item.id === a.id
            ? { ...item, is_published: !item.is_published }
            : item
          )
        );
        this.toggling = null;
      },
      error: () => { this.toggling = null; }
    });
  }

  duplicateAssignment(a: Assignment): void {
    this.duplicating = a.id;
    const copy = {
      title: a.title + ' (nusxa)',
      description: a.description,
      assignment_type: a.assignment_type,
      time_limit: a.time_limit,
      attempts_allowed: a.attempts_allowed,
      order_index: a.order_index + 1,
      is_published: false,
      lesson: a.lesson
    };
    this.assignmentService.create(copy).subscribe({
      next: () => { this.duplicating = null; this.loadAssignments(); },
      error: () => { this.duplicating = null; }
    });
  }

  goBack(): void {
    if (this.moduleId) {
      this.router.navigate(['/modules', this.moduleId, 'lessons']);
    } else {
      this.router.navigate(['/modules']);
    }
  }

  onDelete(assignment: Assignment): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: this.lang.t('dialog.confirmTitle'), message: this.lang.t('assignments.deleteConfirm') }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.assignmentService.delete(assignment.id).subscribe(() => this.loadAssignments());
      }
    });
  }
}
