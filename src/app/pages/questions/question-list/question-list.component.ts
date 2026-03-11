import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { QuestionService } from '../../../core/services/question.service';
import { AssignmentService } from '../../../core/services/assignment.service';
import { Question } from '../../../core/models/question.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-question-list',
  imports: [MatIconModule, TranslatePipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-icon orange">
            <mat-icon>quiz</mat-icon>
          </div>
          <div class="header-text">
            <div class="breadcrumb">
              <span class="bc-link" (click)="goBack()">{{ assignmentTitle() }}</span>
              <mat-icon class="bc-sep">chevron_right</mat-icon>
              <span>Savollar</span>
            </div>
            <h1>{{ 'questions.title' | translate }}</h1>
          </div>
        </div>
        <button class="add-btn" (click)="addQuestion()">
          <mat-icon>add</mat-icon>
          {{ 'questions.add' | translate }}
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {

        <!-- Summary -->
        @if (questions().length > 0) {
          <div class="summary-bar">
            <div class="sb-item">
              <div class="sb-icon orange"><mat-icon>quiz</mat-icon></div>
              <div class="sb-info">
                <span class="sb-num">{{ questions().length }}</span>
                <span class="sb-lbl">Jami savollar</span>
              </div>
            </div>
            <div class="sb-item">
              <div class="sb-icon blue"><mat-icon>stars</mat-icon></div>
              <div class="sb-info">
                <span class="sb-num">{{ totalPoints }}</span>
                <span class="sb-lbl">Jami ball</span>
              </div>
            </div>
            <div class="sb-item">
              <div class="sb-icon green"><mat-icon>analytics</mat-icon></div>
              <div class="sb-info">
                <span class="sb-num">{{ avgPoints }}</span>
                <span class="sb-lbl">O'rtacha ball</span>
              </div>
            </div>
          </div>
        }

        <!-- Empty -->
        @if (questions().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <mat-icon>quiz</mat-icon>
            </div>
            <h3>Hozircha savollar yo'q</h3>
            <p>Birinchi savolni qo'shib, test yarating</p>
            <button class="add-btn" (click)="addQuestion()">
              <mat-icon>add</mat-icon>
              {{ 'questions.add' | translate }}
            </button>
          </div>
        } @else {
          <div class="questions-list">
            @for (q of questions(); track q.id; let i = $index) {
              <div class="question-card" [style.animation-delay]="(i * 0.05) + 's'">

                <div class="qc-left">
                  <div class="q-num">{{ i + 1 }}</div>
                </div>

                <div class="qc-body">
                  <p class="q-text">{{ q.question_text }}</p>

                  <div class="q-meta">
                    <div class="q-badge points">
                      <mat-icon>stars</mat-icon>
                      {{ q.points }} ball
                    </div>
                    <div class="q-badge order">
                      <mat-icon>sort</mat-icon>
                      Tartib: {{ q.order_index }}
                    </div>
                    @if (q.explanation) {
                      <div class="q-badge hint">
                        <mat-icon>lightbulb</mat-icon>
                        Izoh bor
                      </div>
                    }
                    @if (hasOptions(q)) {
                      <div class="q-badge options">
                        <mat-icon>list</mat-icon>
                        {{ getOptionsCount(q) }} variant
                      </div>
                    }
                  </div>

                  @if (hasOptions(q)) {
                    <div class="q-options">
                      @for (opt of getOptions(q); track $index) {
                        <div class="q-opt" [class.correct]="isCorrect(q, opt)">
                          <div class="opt-dot" [class.correct]="isCorrect(q, opt)">
                            @if (isCorrect(q, opt)) {
                              <mat-icon>check</mat-icon>
                            }
                          </div>
                          <span>{{ opt }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="qc-actions">
                  <button class="q-btn edit" (click)="router.navigate(['/questions', q.id, 'edit'])">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="q-btn delete" (click)="onDelete(q)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { animation: fadeIn 0.4s ease-out; }

    /* Header */
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

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 42px;
      height: 42px;
      border: none;
      background: var(--gray-100);
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gray-600);
      transition: all 0.2s;

      &:hover { background: var(--gray-200); transform: translateX(-3px); }
    }

    .header-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon { font-size: 26px; width: 26px; height: 26px; color: white; }

      &.orange { background: linear-gradient(135deg, #fbbf24, #d97706); box-shadow: 0 6px 20px rgba(217,119,6,0.3); }
    }

    .header-text {
      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--gray-400);
        margin-bottom: 4px;

        .bc-link {
          color: #f59e0b;
          cursor: pointer;
          &:hover { text-decoration: underline; }
        }
        .bc-sep { font-size: 16px; width: 16px; height: 16px; }
      }

      h1 { font-size: 1.4rem; font-weight: 800; color: var(--gray-900); margin: 0; }
    }

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 22px;
      background: linear-gradient(135deg, #fbbf24, #d97706);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(217,119,6,0.3);

      &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(217,119,6,0.4); }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    /* Summary */
    .summary-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .sb-item {
      background: white;
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .sb-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon { font-size: 22px; width: 22px; height: 22px; color: white; }

      &.orange { background: linear-gradient(135deg, #fbbf24, #d97706); }
      &.blue   { background: linear-gradient(135deg, #60a5fa, #2563eb); }
      &.green  { background: linear-gradient(135deg, #34d399, #059669); }
    }

    .sb-info {
      .sb-num { display: block; font-size: 1.5rem; font-weight: 800; color: var(--gray-900); line-height: 1; }
      .sb-lbl { font-size: 0.78rem; color: var(--gray-500); font-weight: 500; }
    }

    /* Questions List */
    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .question-card {
      background: white;
      border-radius: 16px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      display: flex;
      align-items: flex-start;
      gap: 0;
      opacity: 0;
      animation: fadeInUp 0.45s ease-out forwards;
      overflow: hidden;
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 10px 28px rgba(0,0,0,0.09);
        border-color: #fde68a;
        transform: translateX(4px);
      }
    }

    .qc-left {
      padding: 20px 16px;
      background: linear-gradient(180deg, #fffbeb, #fef3c7);
      border-right: 1px solid #fde68a;
      min-height: 100%;
      display: flex;
      align-items: flex-start;
      flex-shrink: 0;
    }

    .q-num {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #fbbf24, #d97706);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 800;
      color: white;
      box-shadow: 0 3px 8px rgba(217,119,6,0.3);
    }

    .qc-body {
      flex: 1;
      padding: 18px 20px;
    }

    .q-text {
      font-size: 0.97rem;
      font-weight: 600;
      color: var(--gray-900);
      margin: 0 0 12px;
      line-height: 1.5;
    }

    .q-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .q-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.76rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 100px;

      mat-icon { font-size: 13px; width: 13px; height: 13px; }

      &.points  { background: #fef3c7; color: #b45309; }
      &.order   { background: var(--gray-100); color: var(--gray-600); }
      &.hint    { background: #ecfdf5; color: #065f46; }
      &.options { background: #dbeafe; color: #1e40af; }
    }

    /* Options Preview */
    .q-options {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
    }

    .q-opt {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 10px;
      font-size: 0.83rem;
      color: var(--gray-700);
      transition: all 0.15s;

      &.correct {
        background: #ecfdf5;
        border-color: #6ee7b7;
        color: #065f46;
        font-weight: 600;
      }
    }

    .opt-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--gray-200);
      border: 2px solid var(--gray-300);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { font-size: 12px; width: 12px; height: 12px; color: white; }

      &.correct {
        background: #10b981;
        border-color: #059669;
      }
    }

    /* Actions */
    .qc-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px 12px;
    }

    .q-btn {
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.18s;

      mat-icon { font-size: 17px; width: 17px; height: 17px; }

      &.edit {
        background: var(--gray-100);
        color: var(--gray-600);
        &:hover { background: var(--gray-200); transform: scale(1.08); }
      }

      &.delete {
        background: #fff1f2;
        color: #e11d48;
        &:hover { background: #ffe4e6; transform: scale(1.08); }
      }
    }

    /* Empty */
    .empty-state {
      text-align: center;
      padding: 80px 24px;
      background: white;
      border-radius: 20px;
      border: 2px dashed var(--gray-200);

      .empty-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #fde68a;

        mat-icon { font-size: 36px; width: 36px; height: 36px; color: #d97706; }
      }

      h3 { font-size: 1.2rem; font-weight: 700; color: var(--gray-800); margin: 0 0 8px; }
      p { color: var(--gray-500); margin: 0 0 24px; font-size: 0.9rem; }
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 14px; align-items: stretch; }
      .summary-bar { grid-template-columns: 1fr; }
      .q-options { grid-template-columns: 1fr; }
    }
  `]
})
export class QuestionListComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private questionService = inject(QuestionService);
  private assignmentService = inject(AssignmentService);
  private dialog = inject(MatDialog);
  private lang = inject(LanguageService);

  loading = signal(true);
  questions = signal<Question[]>([]);
  assignmentId = '';
  assignmentTitle = signal('');
  lessonId = '';

  get totalPoints(): number {
    return this.questions().reduce((s, q) => s + (q.points || 0), 0);
  }

  get avgPoints(): string {
    if (!this.questions().length) return '0';
    return (this.totalPoints / this.questions().length).toFixed(1);
  }

  hasOptions(q: Question): boolean {
    return Array.isArray(q.question_data?.options) && q.question_data.options.length > 0;
  }

  getOptions(q: Question): string[] {
    return q.question_data?.options || [];
  }

  getOptionsCount(q: Question): number {
    return this.getOptions(q).length;
  }

  isCorrect(q: Question, opt: string): boolean {
    const ans = q.correct_answer?.answer;
    if (Array.isArray(ans)) return ans.includes(opt);
    return ans === opt;
  }

  ngOnInit(): void {
    this.assignmentId = this.route.snapshot.params['id'];
    this.loadQuestions();
    this.assignmentService.getById(this.assignmentId).subscribe(a => {
      this.assignmentTitle.set(a.title);
      this.lessonId = a.lesson;
    });
  }

  loadQuestions(): void {
    this.questionService.getAll(this.assignmentId).subscribe({
      next: (data) => { this.questions.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  addQuestion(): void {
    this.router.navigate(['/questions', 'new'], { queryParams: { assignment_id: this.assignmentId } });
  }

  goBack(): void {
    if (this.lessonId) {
      this.router.navigate(['/lessons', this.lessonId, 'assignments']);
    } else {
      this.router.navigate(['/modules']);
    }
  }

  onDelete(question: Question): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: this.lang.t('dialog.confirmTitle'), message: this.lang.t('questions.deleteConfirm') }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.questionService.delete(question.id).subscribe(() => this.loadQuestions());
      }
    });
  }
}
