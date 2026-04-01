import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AssignmentService } from '../../core/services/assignment.service';
import { ProgressService } from '../../core/services/progress.service';
import { StudentService } from '../../core/services/student.service';
import { TeacherService } from '../../core/services/teacher.service';
import { LessonService } from '../../core/services/lesson.service';
import { Assignment } from '../../core/models/assignment.model';
import { AssignmentAttempt, QuestionAnswer } from '../../core/models/progress.model';
import { Student } from '../../core/models/student.model';
import { catchError, of } from 'rxjs';

interface AttemptWithAnswers extends AssignmentAttempt {
  answers?: QuestionAnswer[];
  expanded?: boolean;
  saving?: boolean;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [FormsModule, MatIconModule, DecimalPipe, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="ph-title">
          <mat-icon>grading</mat-icon>
          <div>
            <h1>O'quvchilar natijalari</h1>
            <p>Topshiriq natijalarini ko'ring va baholarni o'zgartiring</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="filter-group">
          <label>Topshiriq tanlang</label>
          <select [(ngModel)]="selectedAssignmentId" (ngModelChange)="onAssignmentChange($event)">
            <option value="">-- Topshiriqni tanlang --</option>
            @for (a of assignments(); track a.id) {
              <option [value]="a.id">{{ a.title }}</option>
            }
          </select>
        </div>
        @if (selectedAssignmentId) {
          <div class="filter-stats">
            <div class="stat-chip">
              <mat-icon>people</mat-icon>
              {{ attempts().length }} ta urinish
            </div>
            <div class="stat-chip passed">
              <mat-icon>check_circle</mat-icon>
              {{ passedCount() }} ta o'tdi
            </div>
            <div class="stat-chip failed">
              <mat-icon>cancel</mat-icon>
              {{ failedCount() }} ta o'tmadi
            </div>
          </div>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Yuklanmoqda...</p>
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && selectedAssignmentId && attempts().length === 0) {
        <div class="empty-state">
          <mat-icon>assignment_turned_in</mat-icon>
          <p>Bu topshiriq uchun hali urinish yo'q</p>
        </div>
      }

      @if (!selectedAssignmentId && !loading()) {
        <div class="empty-state">
          <mat-icon>grading</mat-icon>
          <p>Natijalarni ko'rish uchun topshiriq tanlang</p>
        </div>
      }

      <!-- Attempts Table -->
      @if (!loading() && attempts().length > 0) {
        <div class="table-wrap">
          <table class="results-table">
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Urinish #</th>
                <th>Ball</th>
                <th>Foiz</th>
                <th>Holat</th>
                <th>Topshirilgan</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              @for (att of attempts(); track att.id) {
                <tr class="attempt-row" [class.expanded]="att.expanded">
                  <td>
                    <div class="student-cell">
                      <div class="student-avatar">{{ getInitial(att.student_name) }}</div>
                      <span>{{ att.student_name || att.student }}</span>
                    </div>
                  </td>
                  <td><span class="attempt-num">#{{ att.attempt_number }}</span></td>
                  <td>
                    <div class="score-edit">
                      <input
                        type="number"
                        class="score-input"
                        [value]="att.score ?? 0"
                        [min]="0"
                        [max]="att.max_score"
                        (change)="updateAttemptScore(att, $any($event.target).value)"
                      >
                      <span class="score-max">/ {{ att.max_score }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="pct-badge" [class.good]="(att.percentage ?? 0) >= 60" [class.bad]="(att.percentage ?? 0) < 60">
                      {{ att.percentage | number:'1.0-1' }}%
                    </span>
                  </td>
                  <td>
                    @if (att.is_passed === true) {
                      <span class="status-badge pass"><mat-icon>check_circle</mat-icon> O'tdi</span>
                    } @else if (att.is_passed === false) {
                      <span class="status-badge fail"><mat-icon>cancel</mat-icon> O'tmadi</span>
                    } @else {
                      <span class="status-badge pending-s"><mat-icon>schedule</mat-icon> Kutilmoqda</span>
                    }
                  </td>
                  <td class="date-cell">
                    {{ att.submitted_at ? (att.submitted_at | date:'dd.MM.yyyy HH:mm') : '—' }}
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="btn-detail" (click)="toggleDetail(att)" [class.active]="att.expanded">
                        <mat-icon>{{ att.expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
                        {{ att.expanded ? 'Yopish' : 'Javoblar' }}
                      </button>
                      @if (att.saving) {
                        <span class="saving-indicator"><mat-icon>sync</mat-icon></span>
                      }
                    </div>
                  </td>
                </tr>

                <!-- Expanded answers row -->
                @if (att.expanded) {
                  <tr class="answers-row">
                    <td colspan="7">
                      <div class="answers-panel">
                        @if (!att.answers) {
                          <div class="answers-loading">
                            <div class="spinner sm"></div> Javoblar yuklanmoqda...
                          </div>
                        } @else if (att.answers.length === 0) {
                          <p class="no-answers">Javoblar topilmadi</p>
                        } @else {
                          <div class="answers-list">
                            @for (ans of att.answers; track ans.id; let ai = $index) {
                              <div class="answer-item" [class.correct]="ans.is_correct === true" [class.wrong]="ans.is_correct === false">
                                <div class="ans-num">{{ ai + 1 }}</div>
                                <div class="ans-body">
                                  <div class="ans-data">{{ formatAnswer(ans.answer_data) }}</div>
                                  @if (ans.feedback) {
                                    <div class="ans-feedback">
                                      <mat-icon>auto_awesome</mat-icon>
                                      {{ ans.feedback }}
                                    </div>
                                  }
                                </div>
                                <div class="ans-score">
                                  <input
                                    type="number"
                                    class="ans-score-input"
                                    [value]="ans.points_earned"
                                    [min]="0"
                                    (change)="updateAnswerScore(att, ans, $any($event.target).value)"
                                  >
                                  <span class="ans-correct-icon">
                                    @if (ans.is_correct === true) { <mat-icon class="correct-ic">check_circle</mat-icon> }
                                    @else if (ans.is_correct === false) { <mat-icon class="wrong-ic">cancel</mat-icon> }
                                  </span>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px; display: flex; flex-direction: column; gap: 20px; }

    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .ph-title { display: flex; align-items: center; gap: 16px; }
    .ph-title mat-icon { font-size: 32px; width: 32px; height: 32px; color: #6366f1; }
    .ph-title h1 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin: 0; }
    .ph-title p { font-size: 0.85rem; color: #64748b; margin: 2px 0 0; }

    .filters-row {
      display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
      background: white; border-radius: 14px; padding: 16px 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .filter-group { display: flex; flex-direction: column; gap: 6px; }
    .filter-group label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .filter-group select {
      padding: 9px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 0.88rem; color: #1e293b; background: #f8fafc; min-width: 280px;
      &:focus { outline: none; border-color: #6366f1; }
    }
    .filter-stats { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .stat-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600;
      background: #f1f5f9; color: #475569;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
      &.passed { background: #d1fae5; color: #065f46; }
      &.failed { background: #fee2e2; color: #991b1b; }
    }

    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 80px 20px; gap: 12px;
      color: #94a3b8; background: white; border-radius: 16px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }
      p { font-size: 0.95rem; margin: 0; }
    }

    .spinner {
      width: 36px; height: 36px; border: 3px solid #e2e8f0;
      border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite;
      &.sm { width: 18px; height: 18px; border-width: 2px; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .table-wrap {
      background: white; border-radius: 16px; overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .results-table {
      width: 100%; border-collapse: collapse;
      th {
        padding: 13px 16px; text-align: left; font-size: 0.75rem; font-weight: 700;
        color: #64748b; text-transform: uppercase; letter-spacing: 0.06em;
        background: #f8fafc; border-bottom: 1px solid #e2e8f0;
      }
      td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    }

    .attempt-row {
      transition: background 0.15s;
      &:hover { background: #f8fafc; }
      &.expanded { background: #f0f4ff; }
    }

    .student-cell { display: flex; align-items: center; gap: 10px; }
    .student-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
    }
    .student-cell span { font-size: 0.88rem; font-weight: 600; color: #1e293b; }

    .attempt-num { font-size: 0.82rem; font-weight: 700; color: #6366f1; background: #eef2ff; padding: 3px 8px; border-radius: 6px; }

    .score-edit { display: flex; align-items: center; gap: 6px; }
    .score-input {
      width: 60px; padding: 5px 8px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; font-weight: 700; color: #1e293b; text-align: center;
      &:focus { outline: none; border-color: #6366f1; }
    }
    .score-max { font-size: 0.82rem; color: #94a3b8; }

    .pct-badge {
      padding: 4px 10px; border-radius: 20px; font-size: 0.82rem; font-weight: 700;
      &.good { background: #d1fae5; color: #065f46; }
      &.bad { background: #fee2e2; color: #991b1b; }
    }

    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &.pass { background: #d1fae5; color: #065f46; }
      &.fail { background: #fee2e2; color: #991b1b; }
      &.pending-s { background: #fef3c7; color: #92400e; }
    }

    .date-cell { font-size: 0.8rem; color: #64748b; }

    .action-btns { display: flex; align-items: center; gap: 8px; }
    .btn-detail {
      display: flex; align-items: center; gap: 5px; padding: 7px 12px;
      border: 1.5px solid #e2e8f0; border-radius: 8px; background: white;
      font-size: 0.8rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover, &.active { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
    }
    .saving-indicator {
      color: #6366f1;
      mat-icon { font-size: 18px; width: 18px; height: 18px; animation: spin 1s linear infinite; }
    }

    .answers-row td { padding: 0; background: #f0f4ff; }
    .answers-panel { padding: 16px 20px; }
    .answers-loading { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #64748b; }
    .no-answers { color: #94a3b8; font-size: 0.85rem; margin: 0; }

    .answers-list { display: flex; flex-direction: column; gap: 10px; }
    .answer-item {
      display: flex; align-items: flex-start; gap: 12px;
      background: white; border-radius: 10px; padding: 12px 14px;
      border: 1.5px solid #e2e8f0;
      &.correct { border-color: #6ee7b7; background: #f0fdf4; }
      &.wrong { border-color: #fca5a5; background: #fff5f5; }
    }
    .ans-num {
      width: 26px; height: 26px; border-radius: 50%; background: #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: #64748b; flex-shrink: 0;
    }
    .ans-body { flex: 1; display: flex; flex-direction: column; gap: 5px; }
    .ans-data { font-size: 0.85rem; color: #1e293b; }
    .ans-feedback {
      display: flex; align-items: flex-start; gap: 5px;
      font-size: 0.78rem; color: #7c3aed; font-style: italic;
      mat-icon { font-size: 13px; width: 13px; height: 13px; flex-shrink: 0; margin-top: 1px; }
    }
    .ans-score {
      display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    }
    .ans-score-input {
      width: 52px; padding: 4px 6px; border: 1.5px solid #e2e8f0; border-radius: 7px;
      font-size: 0.85rem; font-weight: 700; text-align: center;
      &:focus { outline: none; border-color: #6366f1; }
    }
    .correct-ic { color: #10b981; font-size: 18px; width: 18px; height: 18px; }
    .wrong-ic { color: #ef4444; font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class ResultsComponent implements OnInit {
  private assignmentService = inject(AssignmentService);
  private progressService = inject(ProgressService);
  private teacherService = inject(TeacherService);

  assignments = signal<Assignment[]>([]);
  attempts = signal<AttemptWithAnswers[]>([]);
  loading = signal(false);
  selectedAssignmentId = '';

  passedCount = () => this.attempts().filter(a => a.is_passed === true).length;
  failedCount = () => this.attempts().filter(a => a.is_passed === false).length;

  ngOnInit() {
    const teacher = this.teacherService.getCurrentTeacher();
    // Load all assignments for this teacher's lessons
    this.assignmentService.getAll().subscribe({
      next: (list) => this.assignments.set(list),
      error: () => {}
    });
  }

  onAssignmentChange(assignmentId: string) {
    if (!assignmentId) { this.attempts.set([]); return; }
    this.loading.set(true);
    this.progressService.getAttempts({ assignment_id: assignmentId }).subscribe({
      next: (list) => {
        this.attempts.set(list.map(a => ({ ...a, expanded: false })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleDetail(att: AttemptWithAnswers) {
    att.expanded = !att.expanded;
    if (att.expanded && att.answers === undefined) {
      this.progressService.getAttemptDetail(att.id).subscribe({
        next: (detail) => {
          const idx = this.attempts().findIndex(a => a.id === att.id);
          if (idx >= 0) {
            const updated = [...this.attempts()];
            updated[idx] = { ...updated[idx], answers: detail.answers || [] };
            this.attempts.set(updated);
          }
        },
        error: () => {
          const idx = this.attempts().findIndex(a => a.id === att.id);
          if (idx >= 0) {
            const updated = [...this.attempts()];
            updated[idx] = { ...updated[idx], answers: [] };
            this.attempts.set(updated);
          }
        }
      });
    }
    // Trigger change detection
    this.attempts.update(list => [...list]);
  }

  updateAttemptScore(att: AttemptWithAnswers, rawValue: string) {
    const score = Math.max(0, Math.min(Number(rawValue) || 0, att.max_score));
    const pct = att.max_score > 0 ? Math.round((score / att.max_score) * 100) : 0;
    const isPassed = pct >= 60;
    const idx = this.attempts().findIndex(a => a.id === att.id);
    if (idx >= 0) {
      const updated = [...this.attempts()];
      updated[idx] = { ...updated[idx], score, percentage: pct, is_passed: isPassed, saving: true };
      this.attempts.set(updated);
    }
    this.progressService.patchAttempt(att.id, { score, percentage: pct, is_passed: isPassed })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        const i = this.attempts().findIndex(a => a.id === att.id);
        if (i >= 0) {
          const updated = [...this.attempts()];
          updated[i] = { ...updated[i], saving: false };
          this.attempts.set(updated);
        }
      });
  }

  updateAnswerScore(att: AttemptWithAnswers, ans: QuestionAnswer, rawValue: string) {
    const points = Math.max(0, Number(rawValue) || 0);
    this.progressService.patchAnswer(ans.id, { points_earned: points })
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        // Update local answer
        const attIdx = this.attempts().findIndex(a => a.id === att.id);
        if (attIdx >= 0 && this.attempts()[attIdx].answers) {
          const updated = [...this.attempts()];
          const answers = [...(updated[attIdx].answers || [])];
          const ansIdx = answers.findIndex(a => a.id === ans.id);
          if (ansIdx >= 0) answers[ansIdx] = { ...answers[ansIdx], points_earned: points };
          updated[attIdx] = { ...updated[attIdx], answers };
          this.attempts.set(updated);
        }
      });
  }

  formatAnswer(answerData: any): string {
    if (!answerData) return '—';
    if (typeof answerData === 'string') return answerData;
    if (answerData.selected !== undefined) {
      const v = answerData.selected;
      if (Array.isArray(v)) return v.join(', ');
      if (typeof v === 'boolean') return v ? "To'g'ri" : "Noto'g'ri";
      return String(v);
    }
    return JSON.stringify(answerData);
  }

  getInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
