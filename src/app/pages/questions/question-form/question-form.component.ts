import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { QuestionService } from '../../../core/services/question.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-question-form',
  imports: [FormsModule, MatIconModule, TranslatePipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-icon orange">
          <mat-icon>{{ isEdit() ? 'edit_note' : 'add_circle' }}</mat-icon>
        </div>
        <div class="header-text">
          <h1>{{ (isEdit() ? 'questions.edit' : 'questions.add') | translate }}</h1>
          <p>{{ isEdit() ? 'Savol ma\'lumotlarini tahrirlash' : 'Yangi savol yaratish' }}</p>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="form-layout">

          <!-- Left: Main Form -->
          <div class="form-main">

            <!-- Question Text -->
            <div class="form-card">
              <div class="card-title">
                <div class="ct-icon blue"><mat-icon>help</mat-icon></div>
                <span>Savol matni</span>
              </div>

              <div class="input-group">
                <label>{{ 'questions.text' | translate }} <span class="req">*</span></label>
                <div class="input-wrap textarea-wrap" [class.error]="qRef.invalid && qRef.touched">
                  <mat-icon>help_outline</mat-icon>
                  <textarea [(ngModel)]="form.question_text" name="question_text"
                            rows="4" placeholder="Savol matnini kiriting..." required
                            #qRef="ngModel"></textarea>
                </div>
                @if (qRef.invalid && qRef.touched) {
                  <span class="err-msg">Savol matni kiritilishi shart</span>
                }
              </div>

              <div class="row-grid">
                <div class="input-group">
                  <label>{{ 'questions.points' | translate }}</label>
                  <div class="input-wrap">
                    <mat-icon>stars</mat-icon>
                    <input type="number" [(ngModel)]="form.points" name="points"
                           placeholder="1" min="0">
                  </div>
                </div>

                <div class="input-group">
                  <label>{{ 'common.order' | translate }}</label>
                  <div class="input-wrap">
                    <mat-icon>sort</mat-icon>
                    <input type="number" [(ngModel)]="form.order_index" name="order_index"
                           placeholder="0" min="0">
                  </div>
                </div>
              </div>

              <div class="input-group">
                <label>{{ 'questions.explanation' | translate }}</label>
                <div class="input-wrap textarea-wrap">
                  <mat-icon>lightbulb</mat-icon>
                  <textarea [(ngModel)]="form.explanation" name="explanation"
                            rows="2" placeholder="Javobni tushuntirish (ixtiyoriy)"></textarea>
                </div>
              </div>
            </div>

            <!-- Options Builder -->
            <div class="form-card">
              <div class="card-title">
                <div class="ct-icon purple"><mat-icon>list</mat-icon></div>
                <span>Javob variantlari</span>
              </div>

              <p class="card-hint">Variantlarni kiriting va to'g'ri javobni belgilang</p>

              <div class="options-list">
                @for (opt of options; track $index; let i = $index) {
                  <div class="option-row" [class.correct-row]="correctAnswers.includes(opt)">
                    <button class="correct-btn" [class.active]="correctAnswers.includes(opt)"
                            type="button" (click)="toggleCorrect(opt)">
                      <mat-icon>{{ correctAnswers.includes(opt) ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    </button>
                    <div class="opt-letter">{{ letters[i] }}</div>
                    <input class="opt-input" [(ngModel)]="options[i]" [name]="'opt_' + i"
                           placeholder="Variant {{ letters[i] }}"
                           (blur)="updateCorrectOnRename($event, i)">
                    <button class="opt-del" type="button" (click)="removeOption(i)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
              </div>

              <button class="add-option-btn" type="button" (click)="addOption()">
                <mat-icon>add</mat-icon>
                Variant qo'shish
              </button>

              @if (correctAnswers.length > 0) {
                <div class="correct-preview">
                  <mat-icon>check_circle</mat-icon>
                  To'g'ri javob: <strong>{{ correctAnswers.join(', ') }}</strong>
                </div>
              }
            </div>

            <!-- JSON Data (advanced) -->
            <div class="form-card collapsible" [class.open]="showAdvanced()">
              <div class="card-title clickable" (click)="showAdvanced.set(!showAdvanced())">
                <div class="ct-icon gray"><mat-icon>code</mat-icon></div>
                <span>Qo'shimcha sozlamalar (JSON)</span>
                <mat-icon class="collapse-icon" [class.rotated]="showAdvanced()">expand_more</mat-icon>
              </div>

              @if (showAdvanced()) {
                <div class="advanced-body">
                  <div class="input-group">
                    <label>{{ 'questions.data' | translate }}</label>
                    <div class="input-wrap textarea-wrap mono">
                      <textarea [(ngModel)]="questionDataStr" name="question_data"
                                rows="5" placeholder='&#123;"options": ["A", "B", "C"]&#125;'
                                (change)="syncFromJson()"></textarea>
                    </div>
                    @if (jsonError()) {
                      <span class="err-msg">Noto'g'ri JSON format</span>
                    }
                  </div>

                  <div class="input-group">
                    <label>{{ 'questions.correctAnswer' | translate }}</label>
                    <div class="input-wrap textarea-wrap mono">
                      <textarea [(ngModel)]="correctAnswerStr" name="correct_answer"
                                rows="3" placeholder='&#123;"answer": "A"&#125;'></textarea>
                    </div>
                  </div>
                </div>
              }
            </div>

          </div>

          <!-- Right: Preview -->
          <div class="form-side">
            <div class="preview-card">
              <div class="preview-title">
                <mat-icon>preview</mat-icon>
                Ko'rinish
              </div>

              <div class="preview-body">
                <div class="prev-q">
                  {{ form.question_text || 'Savol matni bu yerda ko\'rinadi...' }}
                </div>

                @if (options.length > 0) {
                  <div class="prev-opts">
                    @for (opt of options; track $index; let i = $index) {
                      <div class="prev-opt" [class.correct]="correctAnswers.includes(opt)">
                        <div class="prev-letter">{{ letters[i] }}</div>
                        <span>{{ opt || '...' }}</span>
                        @if (correctAnswers.includes(opt)) {
                          <mat-icon class="prev-check">check</mat-icon>
                        }
                      </div>
                    }
                  </div>
                }

                <div class="prev-footer">
                  <span class="prev-badge">
                    <mat-icon>stars</mat-icon>
                    {{ form.points || 0 }} ball
                  </span>
                </div>
              </div>
            </div>

            <!-- Save Actions -->
            <div class="side-actions">
              <button type="button" class="btn secondary full" (click)="goBack()">
                <mat-icon>close</mat-icon>
                Bekor qilish
              </button>
              <button type="button" class="btn primary full" (click)="onSave()"
                      [disabled]="saving() || !form.question_text">
                @if (saving()) {
                  <div class="spin-loader"></div>
                } @else {
                  <mat-icon>save</mat-icon>
                }
                {{ 'common.save' | translate }}
              </button>
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      animation: fadeIn 0.4s ease-out;
    }

    /* Header */
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
      padding: 20px 24px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid var(--gray-100);
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
      flex-shrink: 0;

      &:hover { background: var(--gray-200); transform: translateX(-3px); }
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { font-size: 24px; width: 24px; height: 24px; color: white; }
      &.orange { background: linear-gradient(135deg, #fbbf24, #d97706); box-shadow: 0 4px 14px rgba(217,119,6,0.3); }
    }

    .header-text {
      h1 { font-size: 1.25rem; font-weight: 800; color: var(--gray-900); margin: 0; }
      p  { font-size: 0.82rem; color: var(--gray-500); margin: 3px 0 0; }
    }

    /* Layout */
    .form-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
      align-items: flex-start;

      @media (max-width: 960px) { grid-template-columns: 1fr; }
    }

    .form-main {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Form Card */
    .form-card {
      background: white;
      border-radius: 20px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--gray-800);

      &.clickable { cursor: pointer; user-select: none; }
    }

    .ct-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: white; }

      &.blue   { background: linear-gradient(135deg, #60a5fa, #2563eb); }
      &.purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
      &.gray   { background: var(--gray-200); mat-icon { color: var(--gray-600); } }
    }

    .collapse-icon {
      font-size: 20px; width: 20px; height: 20px;
      color: var(--gray-400);
      margin-left: auto;
      transition: transform 0.2s;
      &.rotated { transform: rotate(180deg); }
    }

    .card-hint {
      font-size: 0.82rem;
      color: var(--gray-500);
      margin: 0;
    }

    .advanced-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Input Group */
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 7px;

      label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--gray-700);
        .req { color: #e11d48; }
      }
    }

    .input-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--gray-50);
      border: 2px solid var(--gray-200);
      border-radius: 12px;
      transition: all 0.18s;

      &:focus-within {
        background: white;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px var(--primary-100);
      }

      &.error { border-color: #ef4444; }

      &.textarea-wrap { align-items: flex-start; padding-top: 14px; }
      &.mono { font-family: 'Courier New', monospace; }

      > mat-icon:first-child {
        font-size: 19px; width: 19px; height: 19px;
        color: var(--gray-400); flex-shrink: 0;
      }

      input, textarea {
        flex: 1; border: none; background: transparent;
        font-size: 0.93rem; color: var(--gray-900);
        outline: none; font-family: inherit;
        &::placeholder { color: var(--gray-400); }
      }

      textarea { resize: vertical; min-height: 80px; }
    }

    .err-msg { font-size: 0.75rem; color: #ef4444; }

    .row-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    /* Options Builder */
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .option-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 12px;
      transition: all 0.18s;

      &.correct-row {
        background: #ecfdf5;
        border-color: #6ee7b7;
      }
    }

    .correct-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.18s;
      flex-shrink: 0;
      padding: 0;

      mat-icon { font-size: 22px; width: 22px; height: 22px; color: var(--gray-300); }

      &.active mat-icon { color: #10b981; }
      &:hover mat-icon { color: #10b981; }
    }

    .opt-letter {
      width: 26px;
      height: 26px;
      background: white;
      border: 1px solid var(--gray-200);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--gray-600);
      flex-shrink: 0;
    }

    .opt-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 0.9rem;
      color: var(--gray-900);
      outline: none;

      &::placeholder { color: var(--gray-400); }
    }

    .opt-del {
      width: 26px;
      height: 26px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 7px;
      transition: all 0.15s;
      flex-shrink: 0;
      padding: 0;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--gray-400); }
      &:hover { background: #ffe4e6; mat-icon { color: #e11d48; } }
    }

    .add-option-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 16px;
      background: var(--primary-50);
      color: var(--primary-600);
      border: 1px dashed var(--primary-300);
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s;
      align-self: flex-start;

      &:hover { background: var(--primary-100); }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .correct-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      border-radius: 10px;
      font-size: 0.83rem;
      color: #065f46;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #10b981; }
    }

    /* Side Panel */
    .form-side {
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: sticky;
      top: 16px;
    }

    .preview-card {
      background: white;
      border-radius: 20px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .preview-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 18px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-bottom: 1px solid #fde68a;
      font-size: 0.85rem;
      font-weight: 700;
      color: #92400e;

      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #d97706; }
    }

    .preview-body {
      padding: 18px;
    }

    .prev-q {
      font-size: 0.93rem;
      font-weight: 600;
      color: var(--gray-900);
      line-height: 1.5;
      margin-bottom: 14px;
      min-height: 48px;
    }

    .prev-opts {
      display: flex;
      flex-direction: column;
      gap: 7px;
      margin-bottom: 14px;
    }

    .prev-opt {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
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

      span { flex: 1; }
    }

    .prev-letter {
      width: 22px;
      height: 22px;
      background: white;
      border: 1px solid var(--gray-300);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--gray-500);
      flex-shrink: 0;
    }

    .prev-check {
      font-size: 16px; width: 16px; height: 16px;
      color: #10b981; flex-shrink: 0;
    }

    .prev-footer {
      border-top: 1px solid var(--gray-100);
      padding-top: 12px;
    }

    .prev-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      padding: 4px 12px;
      border-radius: 100px;

      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    /* Side Actions */
    .side-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.full { width: 100%; }
      mat-icon { font-size: 19px; width: 19px; height: 19px; }

      &.primary {
        background: linear-gradient(135deg, #fbbf24, #d97706);
        color: white;
        box-shadow: 0 4px 14px rgba(217,119,6,0.3);

        &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(217,119,6,0.4); }
        &:disabled { opacity: 0.6; cursor: not-allowed; background: var(--gray-300); box-shadow: none; }
      }

      &.secondary {
        background: var(--gray-100);
        color: var(--gray-700);
        &:hover { background: var(--gray-200); }
      }
    }

    .spin-loader {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class QuestionFormComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private questionService = inject(QuestionService);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  jsonError = signal(false);
  showAdvanced = signal(false);
  questionId = '';
  assignmentId = '';

  form: any = {
    question_text: '',
    points: 1,
    order_index: 0,
    explanation: ''
  };

  options: string[] = ['', ''];
  correctAnswers: string[] = [];
  letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  questionDataStr = '{}';
  correctAnswerStr = '{}';

  addOption(): void {
    if (this.options.length < 6) this.options.push('');
  }

  removeOption(i: number): void {
    const removed = this.options[i];
    this.options.splice(i, 1);
    this.correctAnswers = this.correctAnswers.filter(c => c !== removed);
    this.syncToJson();
  }

  toggleCorrect(opt: string): void {
    if (!opt) return;
    const idx = this.correctAnswers.indexOf(opt);
    if (idx >= 0) {
      this.correctAnswers.splice(idx, 1);
    } else {
      this.correctAnswers = [opt]; // single correct answer
    }
    this.syncToJson();
  }

  updateCorrectOnRename(event: Event, i: number): void {
    this.syncToJson();
  }

  syncToJson(): void {
    const filled = this.options.filter(o => o.trim());
    this.questionDataStr = JSON.stringify({ options: filled }, null, 2);
    const ans = this.correctAnswers.length === 1
      ? { answer: this.correctAnswers[0] }
      : { answer: this.correctAnswers };
    this.correctAnswerStr = JSON.stringify(ans, null, 2);
  }

  syncFromJson(): void {
    try {
      const data = JSON.parse(this.questionDataStr);
      if (Array.isArray(data.options)) {
        this.options = [...data.options];
        if (this.options.length < 2) this.options.push(...['', ''].slice(0, 2 - this.options.length));
      }
      this.jsonError.set(false);
    } catch {
      this.jsonError.set(true);
    }
  }

  ngOnInit(): void {
    this.assignmentId = this.route.snapshot.queryParams['assignment_id'] || '';
    const id = this.route.snapshot.params['id'];

    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.questionId = id;
      this.loading.set(true);
      this.questionService.getById(id).subscribe({
        next: (q) => {
          this.assignmentId = q.assignment;
          this.form = {
            question_text: q.question_text,
            points: q.points,
            order_index: q.order_index,
            explanation: q.explanation
          };
          if (Array.isArray(q.question_data?.options)) {
            this.options = [...q.question_data.options];
            while (this.options.length < 2) this.options.push('');
          }
          const ans = q.correct_answer?.answer;
          if (Array.isArray(ans)) {
            this.correctAnswers = [...ans];
          } else if (ans) {
            this.correctAnswers = [ans];
          }
          this.questionDataStr = JSON.stringify(q.question_data, null, 2);
          this.correctAnswerStr = JSON.stringify(q.correct_answer, null, 2);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  goBack(): void {
    if (this.assignmentId) {
      this.router.navigate(['/assignments', this.assignmentId, 'questions']);
    } else {
      this.router.navigate(['/modules']);
    }
  }

  onSave(): void {
    this.jsonError.set(false);
    this.syncToJson();

    let questionData: any;
    let correctAnswer: any;

    try {
      questionData = JSON.parse(this.questionDataStr);
      correctAnswer = JSON.parse(this.correctAnswerStr);
    } catch {
      this.jsonError.set(true);
      return;
    }

    this.saving.set(true);
    const payload = {
      ...this.form,
      question_data: questionData,
      correct_answer: correctAnswer,
      assignment: this.assignmentId
    };

    if (this.isEdit()) {
      this.questionService.update(this.questionId, payload).subscribe({
        next: () => this.goBack(),
        error: () => this.saving.set(false)
      });
    } else {
      this.questionService.create(payload).subscribe({
        next: () => this.goBack(),
        error: () => this.saving.set(false)
      });
    }
  }
}
