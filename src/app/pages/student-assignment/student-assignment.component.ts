import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, of } from 'rxjs';
import { AssignmentService } from '../../core/services/assignment.service';
import { ProgressService } from '../../core/services/progress.service';
import { StudentService } from '../../core/services/student.service';
import { GeminiService } from '../../core/services/gemini.service';
import { AssignmentDetail, AssignmentQuestion } from '../../core/models/assignment.model';
import { AssignmentAttempt } from '../../core/models/progress.model';

type Phase = 'loading' | 'intro' | 'doing' | 'submitting' | 'grading' | 'result';

interface AiFeedback {
  score: number;
  feedback: string;
}

@Component({
  selector: 'app-student-assignment',
  standalone: true,
  imports: [FormsModule, MatIconModule, DecimalPipe],
  template: `
    <div class="page">

      <!-- Navbar -->
      <nav class="navbar">
        <button class="back-btn" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="nav-title">
          @if (assignment()) {
            <span class="nav-asgn">{{ assignment()!.title }}</span>
          }
        </div>
        @if (phase() === 'doing') {
          <div class="progress-nav">
            <span class="progress-txt">{{ answeredCount() }} / {{ questions().length }}</span>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progressPct()"></div>
            </div>
          </div>
        }
      </nav>

      <div class="content">

        <!-- LOADING -->
        @if (phase() === 'loading') {
          <div class="center-state">
            <div class="spinner"></div>
            <p>Yuklanmoqda...</p>
          </div>
        }

        <!-- INTRO -->
        @if (phase() === 'intro' && assignment()) {
          <div class="intro-card">
            <div class="intro-icon">
              <mat-icon>{{ getTypeIcon() }}</mat-icon>
            </div>
            <h1>{{ assignment()!.title }}</h1>
            @if (assignment()!.description) {
              <div class="intro-desc" [innerHTML]="safe(assignment()!.description!)"></div>
            }
            <div class="intro-meta">
              <div class="meta-item">
                <mat-icon>quiz</mat-icon>
                <span>{{ questions().length }} ta savol</span>
              </div>
              @if (assignment()!.total_points > 0) {
                <div class="meta-item">
                  <mat-icon>star</mat-icon>
                  <span>{{ assignment()!.total_points }} ball</span>
                </div>
              }
              @if (assignment()!.time_limit) {
                <div class="meta-item">
                  <mat-icon>timer</mat-icon>
                  <span>{{ assignment()!.time_limit }} daqiqa</span>
                </div>
              }
              <div class="meta-item">
                <mat-icon>repeat</mat-icon>
                <span>{{ assignment()!.attempts_allowed }} urinish</span>
              </div>
            </div>

            @if (existingAttempt()) {
              <div class="prev-result"
                [class.passed]="existingAttempt()!.is_passed === true"
                [class.failed]="existingAttempt()!.is_passed === false">
                <mat-icon>{{ existingAttempt()!.is_passed ? 'check_circle' : 'cancel' }}</mat-icon>
                <span>Oldingi natija: {{ existingAttempt()!.score ?? 0 }} / {{ existingAttempt()!.max_score }} ball</span>
              </div>
            }

            <button class="btn-start" (click)="startAttempt()">
              <mat-icon>play_arrow</mat-icon>
              {{ existingAttempt() ? 'Qayta boshlash' : 'Boshlash' }}
            </button>
          </div>
        }

        <!-- DOING -->
        @if (phase() === 'doing') {
          <div class="questions-wrap">

            @for (q of questions(); track q.id; let qi = $index) {
              <div class="q-card" [class.answered]="isAnswered(q.id)">

                <div class="q-header">
                  <div class="q-num" [class.done]="isAnswered(q.id)">
                    @if (isAnswered(q.id)) { <mat-icon>check</mat-icon> }
                    @else { {{ qi + 1 }} }
                  </div>
                  @if (isImageUrl(q.question_text) && getQuestionType(q) !== 'matching') {
                    <div class="q-text"><img class="q-img" [src]="q.question_text" alt="question"></div>
                  } @else if (!isImageUrl(q.question_text)) {
                    <div class="q-text" [innerHTML]="safe(q.question_text)"></div>
                  } @else {
                    <!-- matching + image: shown inside match-wrap -->
                    <div class="q-text q-text-muted">Rasmni toping</div>
                  }
                  @if (q.points > 0) {
                    <span class="q-pts">{{ q.points }} ball</span>
                  }
                </div>

                <div class="q-body">

                  <!-- Multiple Choice -->
                  @if (getQuestionType(q) === 'multiple_choice') {
                    <div class="options-list">
                      @for (opt of q.question_data?.options || []; track $index; let oi = $index) {
                        <label class="option" [class.selected]="getAnswer(q.id) === oi">
                          <input type="radio" [name]="'q'+q.id" [value]="oi"
                            [checked]="getAnswer(q.id) === oi"
                            (change)="setAnswer(q.id, oi)">
                          <span class="opt-letter">{{ 'ABCD'[oi] }}</span>
                          <span class="opt-text">{{ opt }}</span>
                        </label>
                      }
                    </div>
                  }

                  <!-- True / False -->
                  @if (getQuestionType(q) === 'true_false') {
                    <div class="tf-row">
                      <label class="option tf" [class.selected]="getAnswer(q.id) === true">
                        <input type="radio" [name]="'q'+q.id" [value]="true"
                          [checked]="getAnswer(q.id) === true"
                          (change)="setAnswer(q.id, true)">
                        <mat-icon>check_circle</mat-icon> To'g'ri
                      </label>
                      <label class="option tf" [class.selected]="getAnswer(q.id) === false">
                        <input type="radio" [name]="'q'+q.id" [value]="false"
                          [checked]="getAnswer(q.id) === false"
                          (change)="setAnswer(q.id, false)">
                        <mat-icon>cancel</mat-icon> Noto'g'ri
                      </label>
                    </div>
                  }

                  <!-- Matching (one-to-many, supports images) -->
                  @if (getQuestionType(q) === 'matching') {
                    <div class="match-wrap">
                      <!-- Left term: image or text -->
                      @if (isImageUrl(q.question_text)) {
                        <div class="match-term-img">
                          <img [src]="q.question_text" alt="term">
                        </div>
                      }
                      <p class="match-hint">
                        <mat-icon>info</mat-icon>
                        Mos keladigan barcha variantlarni belgilang
                      </p>
                      <div class="match-opts">
                        @for (opt of matchPool(q); track opt) {
                          <label class="option match-opt"
                            [class.selected]="isMatchSelected(q.id, opt)"
                            (click)="toggleMatch(q.id, opt)">
                            <input type="checkbox" style="display:none"
                              [checked]="isMatchSelected(q.id, opt)">
                            <span class="match-check">
                              <mat-icon>{{ isMatchSelected(q.id, opt) ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
                            </span>
                            @if (isImageUrl(opt)) {
                              <img class="match-opt-img" [src]="opt" alt="option">
                            } @else {
                              <span class="opt-text">{{ opt }}</span>
                            }
                          </label>
                        }
                      </div>
                    </div>
                  }

                  <!-- Short answer / Essay / Default -->
                  @if (getQuestionType(q) === 'short_answer' || getQuestionType(q) === 'essay' || getQuestionType(q) === 'text') {
                    @if (isImageUrl(q.question_text)) {
                      <div class="img-question-wrap">
                        <img [src]="q.question_text" alt="qurilma rasmi" class="img-question">
                        <p class="img-q-label">
                          <mat-icon>edit</mat-icon>
                          Yuqoridagi qurilmaga ta'rif yozing (o'zbek tilida):
                        </p>
                      </div>
                    }
                    <textarea class="text-answer"
                      [rows]="getQuestionType(q) === 'essay' ? 6 : 4"
                      [value]="getAnswer(q.id) || ''"
                      (input)="setAnswer(q.id, $any($event.target).value)"
                      [placeholder]="isImageUrl(q.question_text)
                        ? 'Masalan: Bu qurilma sistema bloki bo\'lib, kompyuterning asosiy qismidir...'
                        : 'Javobingizni yozing...'">
                    </textarea>
                    @if (isImageUrl(q.question_text)) {
                      <div class="ai-badge">
                        <mat-icon>auto_awesome</mat-icon> AI tomonidan tekshiriladi
                      </div>
                    }
                  }

                </div>
              </div>
            }

            <!-- Submit -->
            <div class="submit-row">
              @if (answeredCount() < questions().length) {
                <p class="submit-hint">
                  <mat-icon>info</mat-icon>
                  {{ questions().length - answeredCount() }} ta savol javobsiz qoldi
                </p>
              }
              <button class="btn-submit" (click)="submitAttempt()" [disabled]="answeredCount() === 0">
                <mat-icon>send</mat-icon>
                Topshiriqni yakunlash
              </button>
            </div>

          </div>
        }

        <!-- SUBMITTING -->
        @if (phase() === 'submitting') {
          <div class="center-state">
            <div class="spinner"></div>
            <p>Yuborilmoqda...</p>
          </div>
        }

        <!-- GRADING -->
        @if (phase() === 'grading') {
          <div class="center-state">
            <div class="ai-spin">
              <mat-icon>auto_awesome</mat-icon>
            </div>
            <p class="grading-txt">AI javoblarni tekshirmoqda...</p>
            <p class="grading-sub">{{ gradingProgress() }}</p>
          </div>
        }

        <!-- RESULT -->
        @if (phase() === 'result' && attempt()) {
          <div class="result-card">
            <div class="result-icon" [class.passed]="attempt()!.is_passed === true" [class.failed]="attempt()!.is_passed === false">
              <mat-icon>{{ attempt()!.is_passed === true ? 'emoji_events' : attempt()!.is_passed === false ? 'sentiment_dissatisfied' : 'assignment_turned_in' }}</mat-icon>
            </div>
            <h2>{{ attempt()!.is_passed === true ? 'Ajoyib!' : attempt()!.is_passed === false ? "Muvaffaqiyatsiz" : "Bajarildi!" }}</h2>
            <div class="score-display">
              <span class="score-num">{{ attempt()!.score ?? 0 }}</span>
              <span class="score-sep">/</span>
              <span class="score-max">{{ attempt()!.max_score }}</span>
            </div>
            @if (attempt()!.percentage != null) {
              <div class="score-pct">{{ attempt()!.percentage | number:'1.0-1' }}%</div>
            }
            @if (aiFeedbacks().size > 0) {
              <div class="ai-feedbacks">
                <h3><mat-icon>auto_awesome</mat-icon> AI baholash natijalari</h3>
                @for (q of aiGradedQuestions(); track q.id; let qi = $index) {
                  @if (aiFeedbacks().get(q.id); as fb) {
                    <div class="ai-fb-item">
                      <div class="ai-fb-header">
                        <img [src]="q.question_text" alt="qurilma" class="ai-fb-img">
                        <div class="ai-fb-score">
                          <span class="fb-pts">{{ fb.score }}</span>
                          <span class="fb-max">/ {{ q.points }} ball</span>
                        </div>
                      </div>
                      <div class="ai-fb-text">
                        <mat-icon>auto_awesome</mat-icon>
                        {{ fb.feedback }}
                      </div>
                    </div>
                  }
                }
              </div>
            }

            <div class="result-actions">
              <button class="btn-back" (click)="goBack()">
                <mat-icon>arrow_back</mat-icon>
                Darsga qaytish
              </button>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: #f1f5f9; }

    .page { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

    /* Navbar */
    .navbar {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 20px; background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      flex-shrink: 0; z-index: 10;
    }
    .back-btn {
      width: 38px; height: 38px; border: none; background: #f1f5f9;
      border-radius: 10px; cursor: pointer; display: flex;
      align-items: center; justify-content: center; color: #64748b;
      flex-shrink: 0; transition: background 0.15s;
      &:hover { background: #e2e8f0; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .nav-title { flex: 1; min-width: 0; }
    .nav-asgn { font-size: 0.95rem; font-weight: 700; color: #1e293b;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .progress-nav { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .progress-txt { font-size: 0.78rem; font-weight: 600; color: #64748b; white-space: nowrap; }
    .progress-bar { width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 3px; transition: width 0.3s; }

    /* Content */
    .content { flex: 1; overflow-y: auto; padding: 24px; }

    /* Center state */
    .center-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 80px 20px; gap: 16px; color: #64748b;
    }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0;
      border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Intro */
    .intro-card {
      max-width: 560px; margin: 0 auto; background: white;
      border-radius: 20px; padding: 40px; text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .intro-icon {
      width: 72px; height: 72px; margin: 0 auto 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 20px; display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 36px; width: 36px; height: 36px; color: white; }
    }
    .intro-card h1 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0 0 12px; }
    .intro-desc { font-size: 0.9rem; color: #64748b; line-height: 1.7; margin-bottom: 24px; }
    .intro-meta {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 28px;
    }
    .meta-item {
      display: flex; align-items: center; gap: 6px;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 8px 14px; font-size: 0.85rem; font-weight: 600; color: #475569;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #6366f1; }
    }
    .prev-result {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px 20px; border-radius: 12px; margin-bottom: 20px;
      font-size: 0.9rem; font-weight: 600; background: #f8fafc; color: #64748b;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &.passed { background: #f0fdf4; color: #15803d; mat-icon { color: #22c55e; } }
      &.failed { background: #fff1f2; color: #dc2626; mat-icon { color: #ef4444; } }
    }
    .btn-start {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 36px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; border: none; border-radius: 14px;
      font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
    }

    /* Questions */
    .questions-wrap { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

    .q-card {
      background: white; border-radius: 16px; padding: 20px;
      border: 2px solid transparent; transition: border-color 0.2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      &.answered { border-color: #10b981; }
    }
    .q-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .q-num {
      width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 700; transition: background 0.2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &.done { background: linear-gradient(135deg, #10b981, #059669); }
    }
    .q-text { flex: 1; font-size: 0.95rem; color: #1e293b; line-height: 1.6; }
    .q-pts { font-size: 0.75rem; font-weight: 700; color: #6366f1; white-space: nowrap;
      background: #ede9fe; padding: 3px 8px; border-radius: 6px; }

    /* Options */
    .options-list { display: flex; flex-direction: column; gap: 8px; }
    .option {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 10px;
      cursor: pointer; transition: all 0.15s; font-size: 0.9rem; color: #374151;
      input[type=radio] { display: none; }
      &:hover { border-color: #6366f1; background: #f5f3ff; }
      &.selected { border-color: #6366f1; background: #ede9fe; color: #4338ca; font-weight: 600; }
    }
    .opt-letter {
      width: 26px; height: 26px; border-radius: 7px; background: #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 800; flex-shrink: 0; color: #64748b;
    }
    .option.selected .opt-letter { background: #6366f1; color: white; }
    .opt-text { flex: 1; }

    /* TF */
    .tf-row { display: flex; gap: 12px; }
    .option.tf { flex: 1; justify-content: center; font-weight: 600;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    /* Question image */
    .q-img { max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: contain; }
    .q-text-muted { color: #94a3b8; font-size: 0.85rem; font-style: italic; }

    /* Matching */
    .match-wrap { display: flex; flex-direction: column; gap: 10px; }
    .match-term-img {
      display: flex; justify-content: center;
      padding: 12px; background: #f8fafc; border-radius: 12px;
      border: 1.5px solid #e2e8f0; margin-bottom: 4px;
      img { max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 8px; }
    }
    .match-hint {
      display: flex; align-items: center; gap: 6px; margin: 0;
      font-size: 0.8rem; color: #92400e; background: #fef3c7;
      padding: 8px 12px; border-radius: 8px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; flex-shrink: 0; }
    }
    .match-opts { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .match-opt {
      align-items: flex-start; padding: 8px;
      &.selected { border-color: #10b981; background: #f0fdf4; color: #065f46; font-weight: 600; }
      &.selected .match-check mat-icon { color: #10b981; }
    }
    .match-check {
      flex-shrink: 0; align-self: flex-start;
      mat-icon { font-size: 22px; width: 22px; height: 22px; color: #cbd5e1; }
    }
    .match-opt-img {
      width: 100%; max-height: 100px; object-fit: contain;
      border-radius: 6px; margin-top: 4px;
    }

    /* Text answer */
    .text-answer {
      width: 100%; box-sizing: border-box;
      padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 0.9rem; font-family: inherit; resize: vertical; outline: none; color: #1e293b;
      &:focus { border-color: #6366f1; }
    }

    /* Submit row */
    .submit-row { padding: 8px 0 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .submit-hint {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.83rem; color: #92400e; background: #fef3c7;
      padding: 8px 16px; border-radius: 8px; margin: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .btn-submit {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; border: none; border-radius: 14px;
      font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
      &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
    }

    /* Result */
    .result-card {
      max-width: 440px; margin: 0 auto; background: white;
      border-radius: 20px; padding: 48px 40px; text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .result-icon {
      width: 80px; height: 80px; margin: 0 auto 20px;
      background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 44px; width: 44px; height: 44px; color: #64748b; }
      &.passed { background: linear-gradient(135deg, #d1fae5, #a7f3d0); mat-icon { color: #059669; } }
      &.failed { background: linear-gradient(135deg, #fee2e2, #fecaca); mat-icon { color: #dc2626; } }
    }
    .result-card h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0 0 24px; }
    .score-display { display: flex; align-items: baseline; justify-content: center; gap: 6px; margin-bottom: 8px; }
    .score-num { font-size: 4rem; font-weight: 900; color: #6366f1; line-height: 1; }
    .score-sep { font-size: 2rem; color: #94a3b8; }
    .score-max { font-size: 2rem; color: #94a3b8; font-weight: 600; }
    .score-pct { font-size: 1.2rem; font-weight: 700; color: #64748b; margin-bottom: 32px; }
    .result-actions { display: flex; justify-content: center; gap: 12px; }
    .btn-back {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 28px; background: #f1f5f9; color: #475569;
      border: none; border-radius: 12px; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #e2e8f0; }
    }
  `]
})
export class StudentAssignmentComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private assignmentService = inject(AssignmentService);
  private progressService = inject(ProgressService);
  private studentService = inject(StudentService);
  private sanitizer = inject(DomSanitizer);
  private geminiService = inject(GeminiService);

  phase = signal<Phase>('loading');
  assignment = signal<AssignmentDetail | null>(null);
  questions = signal<AssignmentQuestion[]>([]);
  attempt = signal<AssignmentAttempt | null>(null);
  existingAttempt = signal<AssignmentAttempt | null>(null);

  private answersMap = new Map<string, any>();
  answeredCount = signal(0);
  aiFeedbacks = signal<Map<string, AiFeedback>>(new Map());
  gradingProgress = signal('');

  aiGradedQuestions = computed(() =>
    this.questions().filter(q =>
      this.getQuestionType(q) === 'short_answer' && this.isImageUrl(q.question_text)
    )
  );

  private moduleId = '';
  private lessonId = '';
  private assignmentId = '';

  progressPct() {
    const total = this.questions().length;
    return total ? Math.round(this.answeredCount() / total * 100) : 0;
  }

  ngOnInit() {
    this.moduleId = this.route.snapshot.paramMap.get('moduleId') || '';
    this.lessonId = this.route.snapshot.paramMap.get('lessonId') || '';
    this.assignmentId = this.route.snapshot.paramMap.get('assignmentId') || '';

    const student = this.studentService.getCurrentStudent();

    this.assignmentService.getById(this.assignmentId).subscribe({
      next: (a) => {
        this.assignment.set(a);
        // Collect all questions: parts questions + direct questions
        const allQ: AssignmentQuestion[] = [
          ...(a.parts || []).flatMap((p: any) => p.questions || []),
          ...(a.questions || []),
        ].sort((x, y) => x.order_index - y.order_index);
        this.questions.set(allQ);

        // Check existing attempts
        if (student) {
          this.progressService.getAttempts({ assignment_id: a.id, student_id: student.id }).subscribe({
            next: (attempts) => {
              const submitted = attempts.filter(at => at.submitted_at);
              if (submitted.length) {
                const best = submitted.reduce((b, c) =>
                  (c.percentage ?? 0) > (b.percentage ?? 0) ? c : b
                );
                this.existingAttempt.set(best);
              }
              this.phase.set('intro');
            },
            error: () => this.phase.set('intro'),
          });
        } else {
          this.phase.set('intro');
        }
      },
      error: () => this.phase.set('intro'),
    });
  }

  startAttempt() {
    const student = this.studentService.getCurrentStudent();
    const a = this.assignment();
    if (!student || !a) return;
    this.phase.set('loading');
    this.answersMap.clear();
    this.matchPoolCache.clear();
    this.answeredCount.set(0);

    this.progressService.createAttempt({
      student: student.id,
      assignment: a.id,
      max_score: a.total_points || a.questions_max_score || 0,
    }).subscribe({
      next: (att) => {
        this.attempt.set(att);
        this.phase.set('doing');
      },
      error: () => this.phase.set('intro'),
    });
  }

  isAnswered(qId: string): boolean {
    if (!this.answersMap.has(qId)) return false;
    const v = this.answersMap.get(qId);
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== '' && v !== undefined;
  }

  getAnswer(qId: string): any {
    return this.answersMap.get(qId);
  }

  setAnswer(qId: string, value: any) {
    const wasAnswered = this.isAnswered(qId);
    this.answersMap.set(qId, value);
    if (!wasAnswered && this.isAnswered(qId)) this.answeredCount.update(n => n + 1);

    const att = this.attempt();
    if (!att) return;
    this.progressService.saveAnswer({ attempt: att.id, question: qId, answer_data: { selected: value } })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  submitAttempt() {
    const att = this.attempt();
    if (!att) return;
    this.phase.set('submitting');
    this.progressService.submitAttempt(att.id).subscribe({
      next: (result) => {
        this.attempt.set(result);
        this.gradeWithAI();
      },
      error: () => {
        this.gradeWithAI();
      },
    });
  }

  private async gradeWithAI() {
    const toGrade = this.aiGradedQuestions();
    if (!toGrade.length) {
      this.phase.set('result');
      return;
    }
    this.phase.set('grading');
    for (let i = 0; i < toGrade.length; i++) {
      const q = toGrade[i];
      this.gradingProgress.set(`${i + 1} / ${toGrade.length} tekshirilmoqda...`);
      const answer = this.answersMap.get(q.id) || '';
      if (answer) {
        const fb = await this.geminiService.gradeImageAnswer(q.question_text, answer, q.points);
        this.aiFeedbacks.update(m => { const nm = new Map(m); nm.set(q.id, fb); return nm; });
      }
    }
    this.phase.set('result');
  }

  goBack() {
    this.router.navigate(['/student/modules', this.moduleId, 'lessons', this.lessonId]);
  }

  getQuestionType(q: AssignmentQuestion): string {
    const data = q.question_data || {};
    if (data.type) return data.type.toLowerCase();
    if (data.options?.length) return 'multiple_choice';
    // matching: has correct_answer + distractors field
    if (q.correct_answer !== undefined && data.distractors !== undefined) return 'matching';
    return 'short_answer';
  }

  // ── Matching helpers ──────────────────────────────────────────
  private matchPoolCache = new Map<string, string[]>();

  matchPool(q: AssignmentQuestion): string[] {
    if (!this.matchPoolCache.has(q.id)) {
      // correct_answer may be a single string or an array (one-to-many)
      const corrects: string[] = Array.isArray(q.correct_answer)
        ? q.correct_answer : (q.correct_answer ? [q.correct_answer] : []);
      const distractors: string[] = q.question_data?.distractors || [];
      const pool = [...new Set([...corrects, ...distractors])].filter(Boolean);
      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      this.matchPoolCache.set(q.id, pool);
    }
    return this.matchPoolCache.get(q.id)!;
  }

  isMatchSelected(qId: string, opt: string): boolean {
    const ans: string[] = this.answersMap.get(qId) || [];
    return ans.includes(opt);
  }

  toggleMatch(qId: string, opt: string) {
    const current: string[] = this.answersMap.get(qId) || [];
    const updated = current.includes(opt)
      ? current.filter(o => o !== opt)
      : [...current, opt];

    const wasAnswered = this.isAnswered(qId);
    this.answersMap.set(qId, updated);
    const nowAnswered = updated.length > 0;
    if (!wasAnswered && nowAnswered) this.answeredCount.update(n => n + 1);
    if (wasAnswered && !nowAnswered) this.answeredCount.update(n => n - 1);

    const att = this.attempt();
    if (!att) return;
    this.progressService.saveAnswer({ attempt: att.id, question: qId, answer_data: { selected: updated } })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  getTypeIcon(): string {
    const type = this.assignment()?.assignment_type;
    const name = (typeof type === 'object' ? type?.name : '') || '';
    const n = name.toLowerCase();
    if (n.includes('test') || n.includes('quiz')) return 'quiz';
    if (n.includes('exam') || n.includes('imtihon')) return 'school';
    if (n.includes('homework') || n.includes('uy')) return 'home';
    return 'assignment';
  }

  isImageUrl(val: string): boolean {
    if (!val || typeof val !== 'string') return false;
    const lower = val.toLowerCase().trim();
    return (
      lower.startsWith('http') ||
      lower.startsWith('/media/') ||
      lower.startsWith('/static/') ||
      /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/.test(lower)
    );
  }

  safe(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }
}
