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
import { AssignmentAttempt, QuestionAnswer } from '../../core/models/progress.model';

type Phase = 'loading' | 'intro' | 'doing' | 'submitting' | 'grading' | 'result' | 'review';

interface PlacedWord {
  number: number;
  direction: 'across' | 'down';
  text: string;
  answer: string;
  row: number;
  col: number;
}

interface CellData {
  correct: string;
  number?: number;
  wordKeys: string[];
}

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
              <div class="meta-item" [class.remaining-green]="remainingAttempts() >= 3"
                                     [class.remaining-yellow]="remainingAttempts() > 0 && remainingAttempts() < 3"
                                     [class.remaining-red]="remainingAttempts() === 0">
                <mat-icon>repeat</mat-icon>
                <span>Qolgan urinishlar: {{ remainingAttempts() }} / {{ assignment()!.attempts_allowed }}</span>
              </div>
            </div>

            @if (allAttempts().length > 0) {
              <div class="attempts-table-wrap">
                <table class="attempts-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Sana</th>
                      <th>Ball</th>
                      <th>Foiz</th>
                      <th>Natija</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (att of allAttempts(); track att.id; let i = $index) {
                      <tr>
                        <td>{{ i + 1 }}</td>
                        <td>{{ formatDate(att.submitted_at) }}</td>
                        <td>{{ att.score ?? 0 }} / {{ att.max_score }}</td>
                        <td>{{ att.percentage ?? 0 }}%</td>
                        <td>
                          @if (att.is_passed === true) {
                            <span class="badge badge-pass">✓ O'tdi</span>
                          } @else {
                            <span class="badge badge-fail">✗ O'tmadi</span>
                          }
                        </td>
                        <td>
                          <button class="btn-view" (click)="viewAttempt(att.id)">Ko'rish</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <button class="btn-start" (click)="startAttempt()" [disabled]="!canStart()">
              <mat-icon>play_arrow</mat-icon>
              {{ allAttempts().length > 0 ? 'Qayta boshlash' : 'Boshlash' }}
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

                  <!-- Crossword Grid -->
                  @if (getQuestionType(q) === 'crossword') {
                    <div class="cw-wrap">
                      <!-- Grid -->
                      <div class="cw-grid-outer">
                        @for (row of getCrosswordGrid(q).rows; track row) {
                          <div class="cw-row">
                            @for (col of getCrosswordGrid(q).cols; track col) {
                              @if (getCellData(q, row, col); as cell) {
                                <div class="cw-cell"
                                  [class.cw-cell-correct]="getCellStatus(q.id, row, col) === 'correct'"
                                  [class.cw-cell-wrong]="getCellStatus(q.id, row, col) === 'wrong'"
                                  [class.cw-cell-empty]="getCellStatus(q.id, row, col) === 'empty'">
                                  @if (cell.number) {
                                    <span class="cw-cell-num">{{ cell.number }}</span>
                                  }
                                  <input
                                    class="cw-cell-input"
                                    maxlength="1"
                                    [id]="'cw_' + q.id + '_' + row + '_' + col"
                                    [value]="getCellValue(q.id, row, col)"
                                    (keydown)="onCwKeydown($event, q, row, col)"
                                    (input)="onCwInput($event, q, row, col)">
                                </div>
                              } @else {
                                <div class="cw-cell cw-cell-empty-space"></div>
                              }
                            }
                          </div>
                        }
                      </div>
                      <!-- Clues list -->
                      <div class="cw-clues-section">
                        @if (getCrosswordClues(q, 'across').length > 0) {
                          <div class="cw-clues-group">
                            <div class="cw-clues-title">→ Gorizontal</div>
                            @for (clue of getCrosswordClues(q, 'across'); track clue.number) {
                              <div class="cw-clue-row-item">
                                <span class="cw-clue-num">{{ clue.number }}.</span>
                                <span class="cw-clue-text">{{ clue.text }}</span>
                              </div>
                            }
                          </div>
                        }
                        @if (getCrosswordClues(q, 'down').length > 0) {
                          <div class="cw-clues-group">
                            <div class="cw-clues-title">↓ Vertikal</div>
                            @for (clue of getCrosswordClues(q, 'down'); track clue.number) {
                              <div class="cw-clue-row-item">
                                <span class="cw-clue-num">{{ clue.number }}.</span>
                                <span class="cw-clue-text">{{ clue.text }}</span>
                              </div>
                            }
                          </div>
                        }
                      </div>
                      <!-- Check button -->
                      <button class="cw-check-btn" (click)="checkCrossword(q)">
                        <mat-icon>check_circle</mat-icon>
                        Tekshirish
                      </button>
                    </div>
                  }

                  <!-- Table Fill -->
                  @if (getQuestionType(q) === 'table_fill') {
                    <div class="tf-student-wrap">
                      <table class="tf-student-table">
                        @if (q.question_data?.headers?.length) {
                          <thead>
                            <tr>
                              @for (h of (q.question_data?.headers || []); track $index) {
                                <th>{{ h }}</th>
                              }
                            </tr>
                          </thead>
                        }
                        <tbody>
                          @for (row of (q.question_data?.rows || []); track $index; let ri = $index) {
                            <tr>
                              @for (cell of row; track $index; let ci = $index) {
                                <td [class.tf-student-editable]="cell.e">
                                  @if (cell.e) {
                                    <input class="tf-student-input"
                                      [value]="getTfValue(q.id, ri, ci)"
                                      (input)="setTfValue(q, ri, ci, $any($event.target).value)"
                                      placeholder="...">
                                  } @else {
                                    {{ cell.v }}
                                  }
                                </td>
                              }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }

                  <!-- File Upload -->
                  @if (getQuestionType(q) === 'file_upload') {
                    <div class="fu-wrap">
                      @if (q.question_data?.description) {
                        <p class="fu-desc">
                          <mat-icon>info</mat-icon>
                          {{ q.question_data.description }}
                        </p>
                      }
                      @if (getFuFile(q.id)) {
                        <div class="fu-selected">
                          <mat-icon>attach_file</mat-icon>
                          <span class="fu-filename">{{ getFuFile(q.id) }}</span>
                          <button type="button" class="fu-clear" (click)="clearFuFile(q)">
                            <mat-icon>close</mat-icon>
                          </button>
                        </div>
                      } @else {
                        <label class="fu-label" [for]="'fu_' + q.id">
                          <mat-icon>cloud_upload</mat-icon>
                          <span>Fayl tanlang</span>
                          <input type="file" [id]="'fu_' + q.id" style="display:none"
                            [attr.accept]="q.question_data?.accept || undefined"
                            (change)="onFuChange($event, q)">
                        </label>
                      }
                      <div class="ai-badge" style="background:#fdf4ff;color:#701a75">
                        <mat-icon>person</mat-icon> O'qituvchi tomonidan baholanadi
                      </div>
                    </div>
                  }

                  <!-- Code -->
                  @if (getQuestionType(q) === 'code') {
                    <div class="code-wrap">
                      @if (q.question_data?.language) {
                        <div class="code-lang-badge">{{ q.question_data.language.toUpperCase() }}</div>
                      }
                      @if (q.question_data?.starter_code) {
                        <div class="code-starter">
                          <div class="code-starter-label">Boshlang'ich kod:</div>
                          <pre class="code-starter-pre">{{ q.question_data.starter_code }}</pre>
                        </div>
                      }
                      <textarea class="code-editor"
                        [value]="getAnswer(q.id) || ''"
                        (input)="setAnswer(q.id, $any($event.target).value, 600)"
                        rows="10"
                        placeholder="Kodingizni shu yerga yozing...">
                      </textarea>
                      <div class="ai-badge">
                        <mat-icon>auto_awesome</mat-icon> AI tomonidan tekshiriladi
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
                      (input)="setAnswer(q.id, $any($event.target).value, 600)"
                      [placeholder]="getTextareaPlaceholder(q)">
                    </textarea>
                    <div class="ai-badge">
                      <mat-icon>auto_awesome</mat-icon> AI tomonidan tekshiriladi
                    </div>
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
                        @if (isImageUrl(q.question_text)) {
                          <img [src]="q.question_text" alt="qurilma" class="ai-fb-img">
                        } @else {
                          <div class="ai-fb-question" [innerHTML]="safe(q.question_text)"></div>
                        }
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

        <!-- REVIEW -->
        @if (phase() === 'review' && reviewAttempt()) {
          <div class="review-wrap">
            <div class="review-header">
              <h2>Urinish ko'rib chiqish</h2>
              <div class="review-meta">
                <span>Ball: <strong>{{ reviewAttempt()!.score ?? 0 }} / {{ reviewAttempt()!.max_score }}</strong></span>
                <span>Foiz: <strong>{{ reviewAttempt()!.percentage ?? 0 }}%</strong></span>
              </div>
            </div>

            @for (q of questions(); track q.id; let qi = $index) {
              @let ans = getReviewAnswer(q.id);
              <div class="review-q-card">
                <div class="review-q-header">
                  <span class="review-q-num">{{ qi + 1 }}</span>
                  <div class="review-q-text" [innerHTML]="safe(q.question_text)"></div>
                  <span class="review-q-pts">{{ ans?.points_earned ?? 0 }}/{{ q.points }} ball</span>
                </div>

                @if (getQuestionType(q) === 'table_fill') {
                  <div class="tf-student-wrap">
                    @let tfCells = ans?.answer_data?.cells || {};
                    <table class="tf-student-table">
                      @if (q.question_data?.headers?.length) {
                        <thead>
                          <tr>
                            @for (h of (q.question_data?.headers || []); track $index) {
                              <th>{{ h }}</th>
                            }
                          </tr>
                        </thead>
                      }
                      <tbody>
                        @for (row of (q.question_data?.rows || []); track $index; let ri = $index) {
                          <tr>
                            @for (cell of row; track $index; let ci = $index) {
                              <td [class.tf-student-editable]="cell.e"
                                  [class.tf-review-correct]="cell.e && (tfCells[ri+'_'+ci]||'').trim().toLowerCase() === (q.correct_answer?.[ri+'_'+ci]||'').trim().toLowerCase() && (tfCells[ri+'_'+ci]||'').trim()"
                                  [class.tf-review-wrong]="cell.e && (tfCells[ri+'_'+ci]||'').trim() && (tfCells[ri+'_'+ci]||'').trim().toLowerCase() !== (q.correct_answer?.[ri+'_'+ci]||'').trim().toLowerCase()"
                                  [class.tf-review-empty]="cell.e && !(tfCells[ri+'_'+ci]||'').trim()">
                                @if (cell.e) {
                                  <span class="tf-review-val">{{ (tfCells[ri+'_'+ci]) || '—' }}</span>
                                } @else {
                                  {{ cell.v }}
                                }
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }

                @if (getQuestionType(q) === 'file_upload') {
                  <div class="review-answer-row">
                    <div class="review-student-ans">
                      <span class="review-label">Holat:</span>
                      <span>{{ ans?.answer_data?.submitted ? '✓ Fayl yuklangan: ' + (ans?.answer_data?.filename || '') : '—' }}</span>
                    </div>
                  </div>
                }

                @if (getQuestionType(q) === 'code') {
                  <div class="review-answer-row">
                    @if (ans?.answer_data?.text || ans?.answer_data?.selected) {
                      <pre class="code-review-pre">{{ ans?.answer_data?.text || ans?.answer_data?.selected }}</pre>
                    }
                    @if (ans?.feedback) {
                      <div class="review-feedback">{{ ans?.feedback }}</div>
                    }
                  </div>
                }

                @if (getQuestionType(q) === 'crossword') {
                  <div class="cw-wrap">
                    <div class="cw-grid-outer">
                      @for (row of getCrosswordGrid(q).rows; track row) {
                        <div class="cw-row">
                          @for (col of getCrosswordGrid(q).cols; track col) {
                            @if (getCellData(q, row, col); as cell) {
                              @let userCells = ans?.answer_data?.cells || {};
                              @let userLetter = (userCells[row + '_' + col] || '').toUpperCase();
                              <div class="cw-cell"
                                [class.cw-cell-correct]="userLetter === cell.correct"
                                [class.cw-cell-wrong]="userLetter && userLetter !== cell.correct"
                                [class.cw-cell-empty]="!userLetter">
                                @if (cell.number) {
                                  <span class="cw-cell-num">{{ cell.number }}</span>
                                }
                                <div class="cw-cell-review-letter">{{ userLetter || '?' }}</div>
                              </div>
                            } @else {
                              <div class="cw-cell cw-cell-empty-space"></div>
                            }
                          }
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <div class="review-answer-row">
                    <div class="review-student-ans">
                      <span class="review-label">Javob:</span>
                      <span>{{ (ans?.answer_data?.text || ans?.answer_data?.selected) ?? '—' }}</span>
                    </div>
                    @if (ans?.feedback) {
                      <div class="review-feedback">{{ ans?.feedback }}</div>
                    }
                  </div>
                }
              </div>
            }

            <button class="btn-back" (click)="phase.set('intro')">
              <mat-icon>arrow_back</mat-icon>
              Orqaga
            </button>
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
    .ai-fb-question {
      flex: 1; font-size: 0.88rem; color: #1e293b; font-weight: 500;
      line-height: 1.5; max-height: 60px; overflow: hidden;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    }

.remaining-green span { color: #16a34a; font-weight: 600; }
.remaining-yellow span { color: #ca8a04; font-weight: 600; }
.remaining-red span { color: #dc2626; font-weight: 600; }

.attempts-table-wrap {
  width: 100%;
  overflow-x: auto;
  margin: 16px 0;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
.attempts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.attempts-table th {
  background: #f8fafc;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}
.attempts-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}
.attempts-table tr:last-child td { border-bottom: none; }
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.badge-pass { background: #dcfce7; color: #16a34a; }
.badge-fail { background: #fee2e2; color: #dc2626; }

    /* Table Fill — student */
    .tf-student-wrap { overflow-x: auto; }
    .tf-student-table {
      border-collapse: collapse; font-size: 0.88rem; min-width: 280px;
      th { background: #f8fafc; padding: 8px 12px; text-align: left; font-weight: 600; color: #475569; border: 1.5px solid #e2e8f0; }
      td { padding: 6px 10px; border: 1.5px solid #e2e8f0; color: #334155; vertical-align: middle; }
    }
    .tf-student-editable { background: #f0fdf4; min-width: 100px; }
    .tf-student-input {
      width: 100%; border: none; background: transparent;
      font-size: 0.88rem; color: #1e293b; outline: none; font-family: inherit;
      padding: 2px 0;
      &::placeholder { color: #94a3b8; }
      &:focus { border-bottom: 1.5px solid #6366f1; }
    }
    .tf-review-correct { background: #dcfce7 !important; }
    .tf-review-wrong { background: #fee2e2 !important; }
    .tf-review-empty { background: #fef9c3 !important; }
    .tf-review-val { font-weight: 600; }

    /* File Upload — student */
    .fu-wrap { display: flex; flex-direction: column; gap: 10px; }
    .fu-desc {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.85rem; color: #701a75; background: #fdf4ff;
      padding: 8px 12px; border-radius: 8px; margin: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    }
    .fu-label {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 20px; border: 2px dashed #e879f9; border-radius: 12px;
      cursor: pointer; color: #9d174d; font-size: 0.9rem; font-weight: 600;
      background: #fdf4ff; transition: all 0.15s; align-self: flex-start;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
      &:hover { background: #fce7f3; border-color: #c026d3; }
    }
    .fu-selected {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; background: #f0fdf4; border: 1.5px solid #86efac;
      border-radius: 10px; font-size: 0.88rem;
      mat-icon { color: #16a34a; font-size: 20px; width: 20px; height: 20px; }
    }
    .fu-filename { flex: 1; color: #166534; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .fu-clear {
      width: 24px; height: 24px; border: none; background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center; border-radius: 50%; padding: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #64748b; }
      &:hover { background: #fee2e2; mat-icon { color: #dc2626; } }
    }

    /* Code — student */
    .code-wrap { display: flex; flex-direction: column; gap: 10px; }
    .code-lang-badge {
      display: inline-block; padding: 3px 10px; border-radius: 6px;
      background: #f3e8ff; color: #6b21a8; font-size: 11px; font-weight: 700;
      letter-spacing: 0.05em; align-self: flex-start;
    }
    .code-starter { background: #1e293b; border-radius: 10px; overflow: hidden; }
    .code-starter-label { font-size: 11px; font-weight: 600; color: #94a3b8; padding: 6px 12px 0; }
    .code-starter-pre {
      margin: 0; padding: 8px 12px 12px; font-size: 12px; color: #e2e8f0;
      font-family: 'Courier New', monospace; white-space: pre-wrap; line-height: 1.5;
    }
    .code-editor {
      width: 100%; box-sizing: border-box; padding: 12px;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 13px; font-family: 'Courier New', monospace;
      line-height: 1.6; resize: vertical; outline: none; color: #1e293b;
      background: #f8fafc;
      &:focus { border-color: #6366f1; background: white; }
    }
    .code-review-pre {
      margin: 0; padding: 10px 14px; background: #1e293b; color: #e2e8f0;
      border-radius: 8px; font-size: 12px; font-family: 'Courier New', monospace;
      white-space: pre-wrap; line-height: 1.5; overflow-x: auto;
    }

    .ai-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.78rem; font-weight: 600; color: #2563eb;
      background: #eff6ff; padding: 4px 10px; border-radius: 6px; align-self: flex-start;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .cw-wrap { display: flex; flex-direction: column; gap: 16px; }

    .cw-grid-outer { display: inline-flex; flex-direction: column; gap: 1px; overflow-x: auto; }
    .cw-row { display: flex; gap: 1px; }
    .cw-cell {
      width: 36px; height: 36px; border: 1.5px solid #94a3b8;
      position: relative; background: #fff; flex-shrink: 0;
    }
    .cw-cell-empty-space { width: 36px; height: 36px; background: transparent; flex-shrink: 0; }
    .cw-cell-correct { background: #dcfce7 !important; border-color: #16a34a; }
    .cw-cell-wrong { background: #fee2e2 !important; border-color: #dc2626; }
    .cw-cell-empty { background: #fef9c3 !important; border-color: #ca8a04; }
    .cw-cell-num {
      position: absolute; top: 1px; left: 2px;
      font-size: 9px; font-weight: 700; color: #475569; line-height: 1;
      pointer-events: none; z-index: 1;
    }
    .cw-cell-input {
      width: 100%; height: 100%; border: none; outline: none;
      text-align: center; font-size: 15px; font-weight: 700;
      text-transform: uppercase; background: transparent;
      padding: 0; cursor: text;
    }
    .cw-clues-section { display: flex; flex-wrap: wrap; gap: 16px; }
    .cw-clues-group { min-width: 180px; }
    .cw-clues-title { font-weight: 700; color: #475569; font-size: 13px; margin-bottom: 6px; }
    .cw-clue-row-item { display: flex; gap: 6px; font-size: 13px; margin-bottom: 4px; color: #334155; }
    .cw-clue-num { font-weight: 700; min-width: 20px; color: #6366f1; }
    .cw-clue-text { flex: 1; }
    .cw-check-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: #6366f1; color: #fff; border: none;
      padding: 8px 18px; border-radius: 8px; font-size: 14px;
      font-weight: 600; cursor: pointer; align-self: flex-start;
    }
    .cw-check-btn:hover { background: #4f46e5; }
    .btn-view {
      background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
      padding: 3px 10px; border-radius: 6px; font-size: 12px;
      cursor: pointer; font-weight: 500;
    }
    .btn-view:hover { background: #e2e8f0; }
    .review-wrap { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; padding: 16px; }
    .review-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .review-header h2 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0; }
    .review-meta { display: flex; gap: 16px; font-size: 14px; color: #475569; }
    .review-q-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; }
    .review-q-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
    .review-q-num { background: #6366f1; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .review-q-text { flex: 1; font-size: 14px; color: #1e293b; }
    .review-q-pts { font-size: 13px; font-weight: 600; color: #6366f1; white-space: nowrap; }
    .review-answer-row { display: flex; flex-direction: column; gap: 6px; }
    .review-student-ans { display: flex; gap: 8px; font-size: 14px; color: #334155; }
    .review-label { font-weight: 600; color: #475569; }
    .review-feedback { font-size: 13px; color: #6366f1; font-style: italic; padding: 6px 10px; background: #f0f0ff; border-radius: 6px; }
    .cw-cell-review-letter { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; text-transform: uppercase; }
    .btn-back { display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-back:hover { background: #e2e8f0; }
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
  allAttempts = signal<AssignmentAttempt[]>([]);
  usedAttempts = computed(() => this.allAttempts().length);
  remainingAttempts = computed(() =>
    Math.max(0, (this.assignment()?.attempts_allowed ?? 0) - this.usedAttempts())
  );
  canStart = computed(() => this.remainingAttempts() > 0);

  private answersMap = new Map<string, any>();
  private savedAnswerIds = new Map<string, string>(); // questionId → answerId
  private saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
  answeredCount = signal(0);
  aiFeedbacks = signal<Map<string, AiFeedback>>(new Map());
  gradingProgress = signal('');
  reviewAttempt = signal<(AssignmentAttempt & { answers: QuestionAnswer[] }) | null>(null);
  cwChecked = signal<Map<string, Map<string, 'correct' | 'wrong' | 'empty'>>>(new Map());

  aiGradedQuestions = computed(() =>
    this.questions().filter(q => {
      const type = this.getQuestionType(q);
      return type === 'short_answer' || type === 'essay' || type === 'code';
    })
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
              this.allAttempts.set(submitted);
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
    if (!this.canStart()) {
      alert('Urinishlar soni tugadi!');
      return;
    }
    const student = this.studentService.getCurrentStudent();
    const a = this.assignment();
    if (!student || !a) return;
    this.phase.set('loading');
    this.answersMap.clear();
    this.savedAnswerIds.clear();
    this.saveTimers.forEach(t => clearTimeout(t));
    this.saveTimers.clear();
    this.matchPoolCache.clear();
    this.fuFiles.clear();
    this.answeredCount.set(0);

    const computedMax = this.questions().reduce((sum, q) => sum + (q.points || 0), 0);
    this.progressService.createAttempt({
      student: student.id,
      assignment: a.id,
      max_score: a.total_points || a.questions_max_score || computedMax,
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
    if (v !== null && typeof v === 'object') return Object.keys(v).length > 0;
    return v !== null && v !== '' && v !== undefined;
  }

  getAnswer(qId: string): any {
    return this.answersMap.get(qId);
  }

  setAnswer(qId: string, value: any, debounceMs = 0) {
    const wasAnswered = this.isAnswered(qId);
    this.answersMap.set(qId, value);
    if (!wasAnswered && this.isAnswered(qId)) this.answeredCount.update(n => n + 1);

    const att = this.attempt();
    if (!att) return;

    // Eski timer bor bo'lsa bekor qilamiz (debounce)
    const existing = this.saveTimers.get(qId);
    if (existing) clearTimeout(existing);

    const doSave = () => {
      this.saveTimers.delete(qId);
      const answerId = this.savedAnswerIds.get(qId);
      if (answerId) {
        // Allaqachon saqlangan — PATCH
        this.progressService.patchAnswer(answerId, { answer_data: { selected: value } })
          .pipe(catchError(() => of(null)))
          .subscribe();
      } else {
        // Birinchi marta — POST
        this.progressService.saveAnswer({ attempt: att.id, question: qId, answer_data: { selected: value } })
          .pipe(catchError(() => of(null)))
          .subscribe(res => {
            if (res?.id) this.savedAnswerIds.set(qId, res.id);
          });
      }
    };

    if (debounceMs > 0) {
      this.saveTimers.set(qId, setTimeout(doSave, debounceMs));
    } else {
      doSave();
    }
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
    // Grade table_fill questions (synchronous, exact match)
    for (const q of this.questions()) {
      if (this.getQuestionType(q) !== 'table_fill') continue;
      const score = this.gradeTfQuestion(q);
      const answerId = this.savedAnswerIds.get(q.id);
      if (answerId) {
        this.progressService.patchAnswer(answerId, {
          points_earned: score,
          is_correct: score === q.points,
        }).pipe(catchError(() => of(null))).subscribe();
      }
    }

    const toGrade = this.aiGradedQuestions();
    if (!toGrade.length) {
      this.phase.set('result');
      return;
    }
    this.phase.set('grading');
    let aiTotal = 0;
    for (let i = 0; i < toGrade.length; i++) {
      const q = toGrade[i];
      this.gradingProgress.set(`${i + 1} / ${toGrade.length} tekshirilmoqda...`);
      const answer = this.answersMap.get(q.id) || '';
      if (!answer) continue;

      let fb: { score: number; feedback: string };
      if (this.isImageUrl(q.question_text)) {
        fb = await this.geminiService.gradeImageAnswer(q.question_text, answer, q.points);
      } else {
        const correctAnswer = q.correct_answer != null
          ? (typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer))
          : '';
        fb = await this.geminiService.gradeShortTextAnswer(q.question_text, correctAnswer, answer, q.points);
      }

      console.log(`[gradeWithAI] q=${q.id} score=${fb.score}/${q.points}`);
      aiTotal += fb.score;
      this.aiFeedbacks.update(m => { const nm = new Map(m); nm.set(q.id, fb); return nm; });

      // Save per-question feedback to backend
      const answerId = this.savedAnswerIds.get(q.id);
      if (answerId) {
        this.progressService.patchAnswer(answerId, {
          points_earned: Math.round(fb.score),
          feedback: fb.feedback,
          is_correct: fb.score >= q.points * 0.5,
        }).pipe(catchError(() => of(null))).subscribe();
      }
    }

    // Update attempt total score
    const att = this.attempt();
    if (att && aiTotal > 0) {
      const newScore = Math.round((att.score ?? 0) + aiTotal);
      const newMax = att.max_score ?? 0;
      const newPct = newMax > 0 ? Math.round((newScore / newMax) * 100) : 0;
      this.attempt.update(a => a ? { ...a, score: newScore, percentage: newPct } : a);
      this.progressService.patchAttempt(att.id, { score: newScore, percentage: newPct })
        .pipe(catchError(() => of(null)))
        .subscribe(updated => {
          if (updated) this.attempt.set(updated);
        });
    }

    this.phase.set('result');
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getReviewAnswer(qId: string): QuestionAnswer | undefined {
    return (this.reviewAttempt()?.answers ?? []).find(a => a.question === qId);
  }

  viewAttempt(id: string) {
    this.phase.set('loading');
    this.progressService.getAttemptDetail(id).subscribe({
      next: (detail) => {
        this.reviewAttempt.set(detail);
        this.phase.set('review');
      },
      error: () => this.phase.set('intro'),
    });
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
    const answerId = this.savedAnswerIds.get(qId);
    if (answerId) {
      this.progressService.patchAnswer(answerId, { answer_data: { selected: updated } })
        .pipe(catchError(() => of(null))).subscribe();
    } else {
      this.progressService.saveAnswer({ attempt: att.id, question: qId, answer_data: { selected: updated } })
        .pipe(catchError(() => of(null)))
        .subscribe(res => { if (res?.id) this.savedAnswerIds.set(qId, res.id); });
    }
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

  getTextareaPlaceholder(q: AssignmentQuestion): string {
    return this.isImageUrl(q.question_text)
      ? "Masalan: Bu qurilma sistema bloki bo'lib, kompyuterning asosiy qismidir..."
      : 'Javobingizni yozing...';
  }

  // ── Crossword helpers ──────────────────────────────────────
  buildCrosswordGrid(clues: any[]): { placed: PlacedWord[]; grid: Map<string, CellData> } {
    const placed: PlacedWord[] = [];
    const grid = new Map<string, CellData>();

    const setCell = (r: number, c: number, letter: string, wordKey: string, num?: number) => {
      const key = `${r}_${c}`;
      const existing = grid.get(key);
      if (existing) {
        if (!existing.wordKeys.includes(wordKey)) existing.wordKeys.push(wordKey);
      } else {
        grid.set(key, { correct: letter, number: num, wordKeys: [wordKey] });
      }
    };

    const canPlace = (word: string, dir: 'across' | 'down', row: number, col: number): boolean => {
      for (let i = 0; i < word.length; i++) {
        const r = dir === 'across' ? row : row + i;
        const c = dir === 'across' ? col + i : col;
        const key = `${r}_${c}`;
        const cell = grid.get(key);
        if (cell && cell.correct !== word[i]) return false;
      }
      return true;
    };

    const placeWord = (pw: PlacedWord) => {
      const wordKey = `${pw.number}_${pw.direction}`;
      for (let i = 0; i < pw.answer.length; i++) {
        const r = pw.direction === 'across' ? pw.row : pw.row + i;
        const c = pw.direction === 'across' ? pw.col + i : pw.col;
        setCell(r, c, pw.answer[i], wordKey, i === 0 ? pw.number : undefined);
      }
      placed.push(pw);
    };

    const words = clues
      .filter(c => c.answer && c.text)
      .map(c => ({ ...c, answer: (c.answer as string).toUpperCase().replace(/\s/g, '') }));

    if (!words.length) return { placed, grid };

    const OFFSET = 20;
    const first = words[0];
    const firstDir = first.direction === 'across' || first.direction === 'down' ? first.direction : 'across';
    placeWord({ ...first, direction: firstDir, row: OFFSET, col: OFFSET });

    for (let wi = 1; wi < words.length; wi++) {
      const w = words[wi];
      let bestDir: 'across' | 'down' = w.direction === 'across' || w.direction === 'down' ? w.direction : 'across';
      let found = false;

      for (const pw of placed) {
        if (found) break;
        const dirs: ('across' | 'down')[] = bestDir === 'across' ? ['down', 'across'] : ['across', 'down'];
        for (const tryDir of dirs) {
          if (found) break;
          for (let ai = 0; ai < pw.answer.length; ai++) {
            if (found) break;
            for (let bi = 0; bi < w.answer.length; bi++) {
              if (pw.answer[ai] !== w.answer[bi]) continue;
              const pr = pw.direction === 'across' ? pw.row : pw.row + ai;
              const pc = pw.direction === 'across' ? pw.col + ai : pw.col;
              const nr = tryDir === 'across' ? pr : pr - bi;
              const nc = tryDir === 'across' ? pc - bi : pc;
              if (canPlace(w.answer, tryDir, nr, nc)) {
                placeWord({ ...w, direction: tryDir, row: nr, col: nc });
                found = true;
                break;
              }
            }
          }
        }
      }

      if (!found) {
        const rows = [...grid.keys()].map(k => parseInt(k.split('_')[0]));
        const maxRow = rows.length ? Math.max(...rows) : OFFSET;
        placeWord({ ...w, direction: bestDir, row: maxRow + 3, col: OFFSET });
      }
    }

    return { placed, grid };
  }

  private cwGridCache = new Map<string, { placed: PlacedWord[]; grid: Map<string, CellData> }>();

  getCrosswordGrid(q: any): { placed: PlacedWord[]; grid: Map<string, CellData>; rows: number[]; cols: number[] } {
    if (!this.cwGridCache.has(q.id)) {
      this.cwGridCache.set(q.id, this.buildCrosswordGrid(q.question_data?.clues || []));
    }
    const { placed, grid } = this.cwGridCache.get(q.id)!;
    const keys = [...grid.keys()];
    const rows = [...new Set(keys.map(k => parseInt(k.split('_')[0])))].sort((a, b) => a - b);
    const cols = [...new Set(keys.map(k => parseInt(k.split('_')[1])))].sort((a, b) => a - b);
    return { placed, grid, rows, cols };
  }

  getCellData(q: any, row: number, col: number): CellData | null {
    return this.getCrosswordGrid(q).grid.get(`${row}_${col}`) ?? null;
  }

  getCellValue(qId: string, row: number, col: number): string {
    const map: Record<string, string> = this.answersMap.get(qId) || {};
    return map[`${row}_${col}`] || '';
  }

  setCellValue(qId: string, row: number, col: number, value: string, direction: 'across' | 'down') {
    const current: Record<string, string> = { ...(this.answersMap.get(qId) || {}) };
    const key = `${row}_${col}`;
    if (value.trim()) {
      current[key] = value.toUpperCase()[0] || '';
    } else {
      delete current[key];
    }
    const wasAnswered = this.isAnswered(qId);
    this.answersMap.set(qId, current);
    const nowAnswered = Object.keys(current).length > 0;
    if (!wasAnswered && nowAnswered) this.answeredCount.update(n => n + 1);
    if (wasAnswered && !nowAnswered) this.answeredCount.update(n => n - 1);

    const att = this.attempt();
    if (!att) return;
    const answerId = this.savedAnswerIds.get(qId);
    if (answerId) {
      this.progressService.patchAnswer(answerId, { answer_data: { cells: current } })
        .pipe(catchError(() => of(null))).subscribe();
    } else {
      this.progressService.saveAnswer({ attempt: att.id, question: qId, answer_data: { cells: current } })
        .pipe(catchError(() => of(null)))
        .subscribe(ans => { if (ans) this.savedAnswerIds.set(qId, ans.id); });
    }
  }

  getCellStatus(qId: string, row: number, col: number): 'correct' | 'wrong' | 'empty' | null {
    const checked = this.cwChecked().get(qId);
    if (!checked) return null;
    return checked.get(`${row}_${col}`) ?? null;
  }

  onCwInput(event: Event, q: any, row: number, col: number) {
    const input = event.target as HTMLInputElement;
    const val = input.value.toUpperCase().slice(-1);
    input.value = val;

    const { placed } = this.getCrosswordGrid(q);
    const pw = placed.find(p => {
      for (let i = 0; i < p.answer.length; i++) {
        const r = p.direction === 'across' ? p.row : p.row + i;
        const c = p.direction === 'across' ? p.col + i : p.col;
        if (r === row && c === col) return true;
      }
      return false;
    });
    const dir = pw?.direction ?? 'across';

    this.setCellValue(q.id, row, col, val, dir);

    if (val) {
      const nextRow = dir === 'down' ? row + 1 : row;
      const nextCol = dir === 'across' ? col + 1 : col;
      const nextEl = document.getElementById(`cw_${q.id}_${nextRow}_${nextCol}`);
      nextEl?.focus();
    }
  }

  onCwKeydown(event: KeyboardEvent, q: any, row: number, col: number) {
    if (event.key !== 'Backspace') return;
    const input = event.target as HTMLInputElement;
    if (input.value) { input.value = ''; this.setCellValue(q.id, row, col, '', 'across'); return; }

    const { placed } = this.getCrosswordGrid(q);
    const pw = placed.find(p => {
      for (let i = 0; i < p.answer.length; i++) {
        const r = p.direction === 'across' ? p.row : p.row + i;
        const c = p.direction === 'across' ? p.col + i : p.col;
        if (r === row && c === col) return true;
      }
      return false;
    });
    const dir = pw?.direction ?? 'across';
    const prevRow = dir === 'down' ? row - 1 : row;
    const prevCol = dir === 'across' ? col - 1 : col;
    const prevEl = document.getElementById(`cw_${q.id}_${prevRow}_${prevCol}`);
    prevEl?.focus();
  }

  checkCrossword(q: any) {
    const { grid } = this.getCrosswordGrid(q);
    const cells = this.answersMap.get(q.id) as Record<string, string> || {};
    const statusMap = new Map<string, 'correct' | 'wrong' | 'empty'>();

    for (const [key, cell] of grid.entries()) {
      const typed = (cells[key] || '').toUpperCase();
      if (!typed) statusMap.set(key, 'empty');
      else if (typed === cell.correct) statusMap.set(key, 'correct');
      else statusMap.set(key, 'wrong');
    }

    this.cwChecked.update(m => { const nm = new Map(m); nm.set(q.id, statusMap); return nm; });

    const correctAnswer: Record<string, string> = q.correct_answer || {};
    const wordKeys = Object.keys(correctAnswer);
    let correctWords = 0;
    for (const wk of wordKeys) {
      const [numStr, dir] = wk.split('_');
      const pw = this.getCrosswordGrid(q).placed.find(p => p.number === +numStr && p.direction === (dir as 'across' | 'down'));
      if (!pw) continue;
      let allCorrect = true;
      for (let i = 0; i < pw.answer.length; i++) {
        const r = pw.direction === 'across' ? pw.row : pw.row + i;
        const c = pw.direction === 'across' ? pw.col + i : pw.col;
        const typed = (cells[`${r}_${c}`] || '').toUpperCase();
        if (typed !== pw.answer[i]) { allCorrect = false; break; }
      }
      if (allCorrect) correctWords++;
    }

    const score = wordKeys.length > 0 ? Math.round((correctWords / wordKeys.length) * q.points) : 0;

    const att = this.attempt();
    const answerId = this.savedAnswerIds.get(q.id);
    if (att && answerId) {
      this.progressService.patchAnswer(answerId, {
        points_earned: score,
        is_correct: score === q.points,
      }).pipe(catchError(() => of(null))).subscribe();

      const newScore = Math.round((att.score ?? 0) + score);
      const newPct = att.max_score > 0 ? Math.round((newScore / att.max_score) * 100) : 0;
      this.attempt.update(a => a ? { ...a, score: newScore, percentage: newPct } : a);
      this.progressService.patchAttempt(att.id, { score: newScore, percentage: newPct })
        .pipe(catchError(() => of(null))).subscribe();
    }
  }

  getCrosswordClues(q: AssignmentQuestion, direction: 'across' | 'down') {
    return (q.question_data?.clues || [])
      .filter((c: any) => c.direction === direction)
      .sort((a: any, b: any) => a.number - b.number);
  }

  // ── Table Fill helpers ─────────────────────────────────────
  getTfValue(qId: string, row: number, col: number): string {
    const map: Record<string, string> = this.answersMap.get(qId) || {};
    return map[`${row}_${col}`] || '';
  }

  setTfValue(q: any, row: number, col: number, value: string) {
    const key = `${row}_${col}`;
    const current: Record<string, string> = { ...(this.answersMap.get(q.id) || {}) };
    if (value.trim()) current[key] = value.trim();
    else delete current[key];

    const wasAnswered = this.isAnswered(q.id);
    this.answersMap.set(q.id, current);
    const nowAnswered = Object.keys(current).length > 0;
    if (!wasAnswered && nowAnswered) this.answeredCount.update(n => n + 1);
    if (wasAnswered && !nowAnswered) this.answeredCount.update(n => n - 1);

    const att = this.attempt();
    if (!att) return;
    const answerId = this.savedAnswerIds.get(q.id);
    if (answerId) {
      this.progressService.patchAnswer(answerId, { answer_data: { cells: current } })
        .pipe(catchError(() => of(null))).subscribe();
    } else {
      this.progressService.saveAnswer({ attempt: att.id, question: q.id, answer_data: { cells: current } })
        .pipe(catchError(() => of(null)))
        .subscribe(ans => { if (ans?.id) this.savedAnswerIds.set(q.id, ans.id); });
    }
  }

  private gradeTfQuestion(q: AssignmentQuestion): number {
    const cells: Record<string, string> = this.answersMap.get(q.id) || {};
    const correct: Record<string, string> = q.correct_answer || {};
    const keys = Object.keys(correct);
    if (!keys.length) return 0;
    let correctCount = 0;
    for (const key of keys) {
      const userVal = (cells[key] || '').trim().toLowerCase();
      const correctVal = (correct[key] || '').trim().toLowerCase();
      if (userVal === correctVal) correctCount++;
    }
    return Math.round((correctCount / keys.length) * q.points);
  }

  // ── File Upload helpers ────────────────────────────────────
  private fuFiles = new Map<string, string>();

  getFuFile(qId: string): string {
    return this.fuFiles.get(qId) || '';
  }

  onFuChange(event: Event, q: any) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fuFiles.set(q.id, file.name);
    const wasAnswered = this.isAnswered(q.id);
    this.answersMap.set(q.id, { filename: file.name, submitted: true });
    if (!wasAnswered) this.answeredCount.update(n => n + 1);

    const att = this.attempt();
    if (!att) return;
    const answerId = this.savedAnswerIds.get(q.id);
    const data = { filename: file.name, submitted: true };
    if (answerId) {
      this.progressService.patchAnswer(answerId, { answer_data: data })
        .pipe(catchError(() => of(null))).subscribe();
    } else {
      this.progressService.saveAnswer({ attempt: att.id, question: q.id, answer_data: data })
        .pipe(catchError(() => of(null)))
        .subscribe(ans => { if (ans?.id) this.savedAnswerIds.set(q.id, ans.id); });
    }
  }

  clearFuFile(q: any) {
    this.fuFiles.delete(q.id);
    if (this.isAnswered(q.id)) this.answeredCount.update(n => Math.max(0, n - 1));
    this.answersMap.delete(q.id);
  }

  safe(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }
}
