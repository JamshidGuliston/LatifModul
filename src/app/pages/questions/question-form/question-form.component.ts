import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { QuestionService } from '../../../core/services/question.service';
import { AssignmentService } from '../../../core/services/assignment.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RichEditorComponent } from '../../../shared/components/rich-editor/rich-editor.component';

@Component({
  selector: 'app-question-form',
  imports: [FormsModule, MatIconModule, TranslatePipe, LoadingSpinnerComponent, RichEditorComponent],
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
          <p>{{ isEdit() ? "Savol ma'lumotlarini tahrirlash" : 'Yangi savol yaratish' }}</p>
        </div>
        @if (questionType() !== 'multiple_choice') {
          <div class="type-badge" [class]="'type-' + questionType()">
            <mat-icon>{{ typeIcon() }}</mat-icon>
            {{ typeName() }}
          </div>
        }
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
                @if (questionType() === 'matching') {
                  <p class="card-hint">Chap tarafdagi element (rasm URL yoki matn)</p>
                }
                <app-rich-editor
                  [(ngModel)]="form.question_text"
                  name="question_text"
                  placeholder="Savol matnini kiriting..."
                  required
                  #qRef="ngModel">
                </app-rich-editor>
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

            <!-- ═══ MULTIPLE CHOICE ═══ -->
            @if (questionType() === 'multiple_choice') {
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
            }

            <!-- ═══ TRUE / FALSE ═══ -->
            @if (questionType() === 'true_false') {
              <div class="form-card">
                <div class="card-title">
                  <div class="ct-icon green"><mat-icon>rule</mat-icon></div>
                  <span>To'g'ri javob</span>
                </div>
                <p class="card-hint">Savol bayonotini kiritib, to'g'ri yoki noto'g'riligini belgilang</p>
                <div class="tf-btns">
                  <button type="button" class="tf-btn" [class.selected-true]="trueFalseAnswer() === true"
                          (click)="trueFalseAnswer.set(true)">
                    <mat-icon>check_circle</mat-icon>
                    To'g'ri (True)
                  </button>
                  <button type="button" class="tf-btn" [class.selected-false]="trueFalseAnswer() === false"
                          (click)="trueFalseAnswer.set(false)">
                    <mat-icon>cancel</mat-icon>
                    Noto'g'ri (False)
                  </button>
                </div>
                @if (trueFalseAnswer() !== null) {
                  <div class="correct-preview" [class.false-preview]="trueFalseAnswer() === false">
                    <mat-icon>{{ trueFalseAnswer() ? 'check_circle' : 'cancel' }}</mat-icon>
                    To'g'ri javob: <strong>{{ trueFalseAnswer() ? "To'g'ri" : "Noto'g'ri" }}</strong>
                  </div>
                }
              </div>
            }

            <!-- ═══ SHORT ANSWER / ESSAY ═══ -->
            @if (questionType() === 'short_answer' || questionType() === 'essay') {
              <div class="form-card">
                <div class="card-title">
                  <div class="ct-icon teal"><mat-icon>edit_note</mat-icon></div>
                  <span>{{ questionType() === 'essay' ? 'Esse savoli' : 'Qisqa javob savoli' }}</span>
                </div>
                <div class="ai-info-block">
                  <mat-icon>auto_awesome</mat-icon>
                  <div>
                    <strong>AI tomonidan baholanadi</strong>
                    <p>Talaba o'z javobini yozadi, AI avtomatik tekshiradi va ball qo'yadi.</p>
                  </div>
                </div>
                <div class="input-group">
                  <label>Namuna javob (ixtiyoriy)</label>
                  <div class="input-wrap textarea-wrap">
                    <mat-icon>lightbulb</mat-icon>
                    <textarea [(ngModel)]="sampleAnswer" name="sample_answer"
                              [rows]="questionType() === 'essay' ? 5 : 3"
                              placeholder="To'g'ri javob namunasi (AI uchun mos lova)..."></textarea>
                  </div>
                </div>
              </div>
            }

            <!-- ═══ MATCHING ═══ -->
            @if (questionType() === 'matching') {
              <div class="form-card">
                <div class="card-title">
                  <div class="ct-icon orange"><mat-icon>compare_arrows</mat-icon></div>
                  <span>Mos javoblar (o'ng tomon)</span>
                </div>
                <p class="card-hint">Chap tomondagi elementga mos keladigan to'g'ri javob(lar)ni kiriting</p>

                <div class="options-list">
                  @for (opt of matchCorrects; track $index; let i = $index) {
                    <div class="option-row correct-row">
                      <mat-icon class="match-icon-correct">check_circle</mat-icon>
                      <input class="opt-input" [(ngModel)]="matchCorrects[i]" [name]="'mc_' + i"
                             placeholder="To'g'ri javob {{ i + 1 }}">
                      <button class="opt-del" type="button" (click)="removeMatchCorrect(i)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
                <button class="add-option-btn" type="button" (click)="addMatchCorrect()">
                  <mat-icon>add</mat-icon>
                  To'g'ri javob qo'shish
                </button>
              </div>

              <div class="form-card">
                <div class="card-title">
                  <div class="ct-icon red"><mat-icon>do_not_disturb</mat-icon></div>
                  <span>Chalg'ituvchi variantlar (Distractors)</span>
                </div>
                <p class="card-hint">Noto'g'ri variantlar — talabani chalg'itish uchun</p>

                <div class="options-list">
                  @for (opt of matchDistractors; track $index; let i = $index) {
                    <div class="option-row">
                      <mat-icon class="match-icon-wrong">close</mat-icon>
                      <input class="opt-input" [(ngModel)]="matchDistractors[i]" [name]="'md_' + i"
                             placeholder="Noto'g'ri variant {{ i + 1 }}">
                      <button class="opt-del" type="button" (click)="removeMatchDistractor(i)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
                <button class="add-option-btn secondary-btn" type="button" (click)="addMatchDistractor()">
                  <mat-icon>add</mat-icon>
                  Chalg'ituvchi qo'shish
                </button>
              </div>
            }

            <!-- ═══ CROSSWORD ═══ -->
            @if (questionType() === 'crossword') {
              <!-- Grid image -->
              <div class="form-card">
                <div class="card-title">
                  <div class="ct-icon indigo"><mat-icon>grid_on</mat-icon></div>
                  <span>Krossvord rasmi</span>
                </div>
                <p class="card-hint">Krossvord panjara rasmini yuklang yoki URL kiriting</p>
                <div class="input-group">
                  <label>Rasm URL</label>
                  <div class="input-wrap">
                    <mat-icon>image</mat-icon>
                    <input type="text" [(ngModel)]="crosswordGridImage" name="cw_grid_image"
                           placeholder="https://... yoki /media/...">
                  </div>
                </div>
                @if (crosswordGridImage) {
                  <img [src]="crosswordGridImage" alt="krossvord" class="cw-preview-img">
                }
              </div>

              <!-- Clues -->
              <div class="form-card">
                <div class="card-title">
                  <div class="ct-icon indigo"><mat-icon>format_list_numbered</mat-icon></div>
                  <span>Ko'rsatmalar (Clues)</span>
                </div>
                <p class="card-hint">Har bir raqam uchun ko'rsatma va to'g'ri javobni kiriting</p>

                <div class="cw-clues-list">
                  @for (clue of crosswordClues; track $index; let i = $index) {
                    <div class="cw-clue-row">
                      <div class="cw-num-wrap">
                        <input type="number" class="cw-num-input" [(ngModel)]="crosswordClues[i].number"
                               [name]="'cw_num_' + i" min="1" placeholder="#">
                        <select class="cw-dir-select" [(ngModel)]="crosswordClues[i].direction" [name]="'cw_dir_' + i">
                          <option value="across">→ Gorizontal</option>
                          <option value="down">↓ Vertikal</option>
                        </select>
                      </div>
                      <div class="cw-text-wrap">
                        <input class="cw-clue-input" [(ngModel)]="crosswordClues[i].text"
                               [name]="'cw_text_' + i" placeholder="Ko'rsatma matni...">
                        <input class="cw-answer-input" [(ngModel)]="crosswordClues[i].answer"
                               [name]="'cw_ans_' + i" placeholder="Javob (katta harf bilan)">
                      </div>
                      <button class="opt-del" type="button" (click)="removeCrosswordClue(i)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                </div>

                <button class="add-option-btn" type="button" (click)="addCrosswordClue()">
                  <mat-icon>add</mat-icon>
                  Ko'rsatma qo'shish
                </button>
              </div>
            }

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
                <div class="prev-q"
                  [innerHTML]="safeHtml(form.question_text) || 'Savol matni bu yerda korinadi...'">
                </div>

                <!-- Preview: Multiple Choice -->
                @if (questionType() === 'multiple_choice' && options.length > 0) {
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

                <!-- Preview: True/False -->
                @if (questionType() === 'true_false') {
                  <div class="prev-opts">
                    <div class="prev-opt" [class.correct]="trueFalseAnswer() === true">
                      <mat-icon style="font-size:16px;width:16px;height:16px;color:#10b981">check_circle</mat-icon>
                      <span>To'g'ri</span>
                      @if (trueFalseAnswer() === true) { <mat-icon class="prev-check">check</mat-icon> }
                    </div>
                    <div class="prev-opt" [class.correct]="trueFalseAnswer() === false">
                      <mat-icon style="font-size:16px;width:16px;height:16px;color:#ef4444">cancel</mat-icon>
                      <span>Noto'g'ri</span>
                      @if (trueFalseAnswer() === false) { <mat-icon class="prev-check">check</mat-icon> }
                    </div>
                  </div>
                }

                <!-- Preview: Short Answer / Essay -->
                @if (questionType() === 'short_answer' || questionType() === 'essay') {
                  <div class="prev-textarea-hint">
                    <mat-icon>edit</mat-icon>
                    Talaba javob yozadi...
                  </div>
                  <div class="prev-ai-badge">
                    <mat-icon>auto_awesome</mat-icon> AI tekshiradi
                  </div>
                }

                <!-- Preview: Matching -->
                @if (questionType() === 'matching') {
                  <div class="prev-match-hint">
                    <mat-icon>compare_arrows</mat-icon>
                    Mos variantni tanlaydi
                  </div>
                }

                <!-- Preview: Crossword -->
                @if (questionType() === 'crossword') {
                  @if (crosswordGridImage) {
                    <img [src]="crosswordGridImage" alt="krossvord" class="prev-img" style="max-height:160px">
                  }
                  @if (crosswordClues.length > 0) {
                    <div class="cw-prev-summary">
                      <span>→ {{ crosswordAcross().length }} gorizontal</span>
                      <span>↓ {{ crosswordDown().length }} vertikal</span>
                    </div>
                  }
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
      width: 42px; height: 42px; border: none;
      background: var(--gray-100); border-radius: 12px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--gray-600); transition: all 0.2s; flex-shrink: 0;
      &:hover { background: var(--gray-200); transform: translateX(-3px); }
    }

    .header-icon {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 24px; width: 24px; height: 24px; color: white; }
      &.orange { background: linear-gradient(135deg, #fbbf24, #d97706); box-shadow: 0 4px 14px rgba(217,119,6,0.3); }
    }

    .header-text {
      flex: 1;
      h1 { font-size: 1.25rem; font-weight: 800; color: var(--gray-900); margin: 0; }
      p  { font-size: 0.82rem; color: var(--gray-500); margin: 3px 0 0; }
    }

    .type-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 100px;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &.type-short_answer, &.type-essay { background: #dbeafe; color: #1d4ed8; }
      &.type-true_false { background: #d1fae5; color: #065f46; }
      &.type-matching { background: #fef3c7; color: #92400e; }
    }

    /* Layout */
    .form-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
      align-items: flex-start;
      @media (max-width: 960px) { grid-template-columns: 1fr; }
    }

    .form-main { display: flex; flex-direction: column; gap: 20px; }

    /* Form Card */
    .form-card {
      background: white; border-radius: 20px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      padding: 24px; display: flex; flex-direction: column; gap: 18px;
    }

    .card-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.95rem; font-weight: 700; color: var(--gray-800);
      &.clickable { cursor: pointer; user-select: none; }
    }

    .ct-icon {
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: white; }
      &.blue   { background: linear-gradient(135deg, #60a5fa, #2563eb); }
      &.purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
      &.green  { background: linear-gradient(135deg, #34d399, #059669); }
      &.teal   { background: linear-gradient(135deg, #2dd4bf, #0d9488); }
      &.orange { background: linear-gradient(135deg, #fbbf24, #d97706); }
      &.red    { background: linear-gradient(135deg, #f87171, #dc2626); }
      &.indigo { background: linear-gradient(135deg, #818cf8, #4f46e5); }
      &.gray   { background: var(--gray-200); mat-icon { color: var(--gray-600); } }
    }

    .collapse-icon {
      font-size: 20px; width: 20px; height: 20px;
      color: var(--gray-400); margin-left: auto;
      transition: transform 0.2s;
      &.rotated { transform: rotate(180deg); }
    }

    .card-hint { font-size: 0.82rem; color: var(--gray-500); margin: 0; }

    .advanced-body { display: flex; flex-direction: column; gap: 16px; }

    /* Input Group */
    .input-group {
      display: flex; flex-direction: column; gap: 7px;
      label { font-size: 0.85rem; font-weight: 600; color: var(--gray-700); .req { color: #e11d48; } }
    }

    .input-wrap {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; background: var(--gray-50);
      border: 2px solid var(--gray-200); border-radius: 12px; transition: all 0.18s;
      &:focus-within { background: white; border-color: var(--primary-500); box-shadow: 0 0 0 3px var(--primary-100); }
      &.error { border-color: #ef4444; }
      &.textarea-wrap { align-items: flex-start; padding-top: 14px; }
      &.mono { font-family: 'Courier New', monospace; }
      > mat-icon:first-child { font-size: 19px; width: 19px; height: 19px; color: var(--gray-400); flex-shrink: 0; }
      input, textarea {
        flex: 1; border: none; background: transparent;
        font-size: 0.93rem; color: var(--gray-900);
        outline: none; font-family: inherit;
        &::placeholder { color: var(--gray-400); }
      }
      textarea { resize: vertical; min-height: 80px; }
    }

    .err-msg { font-size: 0.75rem; color: #ef4444; }

    .row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    /* Options */
    .options-list { display: flex; flex-direction: column; gap: 8px; }

    .option-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; background: var(--gray-50);
      border: 1px solid var(--gray-200); border-radius: 12px; transition: all 0.18s;
      &.correct-row { background: #ecfdf5; border-color: #6ee7b7; }
    }

    .correct-btn {
      width: 28px; height: 28px; border: none; background: transparent;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      border-radius: 50%; transition: all 0.18s; flex-shrink: 0; padding: 0;
      mat-icon { font-size: 22px; width: 22px; height: 22px; color: var(--gray-300); }
      &.active mat-icon { color: #10b981; }
      &:hover mat-icon { color: #10b981; }
    }

    .match-icon-correct { font-size: 20px; width: 20px; height: 20px; color: #10b981; flex-shrink: 0; }
    .match-icon-wrong { font-size: 20px; width: 20px; height: 20px; color: #ef4444; flex-shrink: 0; }

    .opt-letter {
      width: 26px; height: 26px; background: white; border: 1px solid var(--gray-200);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: var(--gray-600); flex-shrink: 0;
    }

    .opt-input {
      flex: 1; border: none; background: transparent;
      font-size: 0.9rem; color: var(--gray-900); outline: none;
      &::placeholder { color: var(--gray-400); }
    }

    .opt-del {
      width: 26px; height: 26px; border: none; background: transparent;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      border-radius: 7px; transition: all 0.15s; flex-shrink: 0; padding: 0;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--gray-400); }
      &:hover { background: #ffe4e6; mat-icon { color: #e11d48; } }
    }

    .add-option-btn {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 16px; background: var(--primary-50);
      color: var(--primary-600); border: 1px dashed var(--primary-300);
      border-radius: 12px; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all 0.18s; align-self: flex-start;
      &:hover { background: var(--primary-100); }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &.secondary-btn { background: #fef3c7; color: #92400e; border-color: #fde68a;
        &:hover { background: #fde68a; } }
    }

    .correct-preview {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; background: #ecfdf5;
      border: 1px solid #6ee7b7; border-radius: 10px;
      font-size: 0.83rem; color: #065f46;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #10b981; }
      &.false-preview { background: #fee2e2; border-color: #fca5a5; color: #991b1b;
        mat-icon { color: #ef4444; } }
    }

    /* True/False */
    .tf-btns { display: flex; gap: 12px; }
    .tf-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 14px; border: 2px solid var(--gray-200); border-radius: 14px;
      background: var(--gray-50); font-size: 0.93rem; font-weight: 600;
      color: var(--gray-600); cursor: pointer; transition: all 0.18s;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
      &:hover { border-color: var(--primary-300); background: var(--primary-50); color: var(--primary-700); }
      &.selected-true { border-color: #10b981; background: #ecfdf5; color: #065f46;
        mat-icon { color: #10b981; } }
      &.selected-false { border-color: #ef4444; background: #fee2e2; color: #991b1b;
        mat-icon { color: #ef4444; } }
    }

    /* AI info block */
    .ai-info-block {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; background: #eff6ff;
      border: 1px solid #bfdbfe; border-radius: 12px;
      mat-icon { color: #2563eb; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
      strong { font-size: 0.88rem; color: #1e40af; display: block; margin-bottom: 4px; }
      p { font-size: 0.8rem; color: #3b82f6; margin: 0; }
    }

    /* Side Panel */
    .form-side {
      display: flex; flex-direction: column; gap: 16px;
      position: sticky; top: 16px;
    }

    .preview-card {
      background: white; border-radius: 20px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden;
    }

    .preview-title {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 18px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-bottom: 1px solid #fde68a;
      font-size: 0.85rem; font-weight: 700; color: #92400e;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #d97706; }
    }

    .preview-body { padding: 18px; }

    .prev-q {
      font-size: 0.93rem; font-weight: 600; color: var(--gray-900);
      line-height: 1.5; margin-bottom: 14px; min-height: 48px;
      img { max-width: 100%; border-radius: 6px; max-height: 140px; object-fit: cover; }
    }

    .prev-img { max-width: 100%; border-radius: 8px; max-height: 120px; object-fit: cover; }

    .prev-opts { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }

    .prev-opt {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; background: var(--gray-50);
      border: 1px solid var(--gray-200); border-radius: 10px;
      font-size: 0.83rem; color: var(--gray-700); transition: all 0.15s;
      &.correct { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; font-weight: 600; }
      span { flex: 1; }
    }

    .prev-letter {
      width: 22px; height: 22px; background: white; border: 1px solid var(--gray-300);
      border-radius: 6px; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: var(--gray-500); flex-shrink: 0;
    }

    .prev-check { font-size: 16px; width: 16px; height: 16px; color: #10b981; flex-shrink: 0; }

    .prev-textarea-hint {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 12px; background: var(--gray-50);
      border: 1px dashed var(--gray-300); border-radius: 10px;
      font-size: 0.82rem; color: var(--gray-500); margin-bottom: 10px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .prev-ai-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.75rem; font-weight: 700; color: #2563eb;
      background: #eff6ff; padding: 4px 10px; border-radius: 100px; margin-bottom: 14px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .prev-match-hint {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 12px; background: #fef3c7;
      border: 1px dashed #fde68a; border-radius: 10px;
      font-size: 0.82rem; color: #92400e; margin-bottom: 14px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    /* Crossword */
    .cw-preview-img { max-width: 100%; max-height: 200px; border-radius: 10px; object-fit: contain; }

    .cw-clues-list { display: flex; flex-direction: column; gap: 10px; }

    .cw-clue-row {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 12px; background: var(--gray-50);
      border: 1px solid var(--gray-200); border-radius: 12px;
    }

    .cw-num-wrap { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }

    .cw-num-input {
      width: 52px; height: 32px; padding: 0 8px;
      border: 1px solid var(--gray-200); border-radius: 8px;
      background: white; font-size: 0.88rem; font-weight: 700;
      color: #4f46e5; text-align: center; outline: none;
      &:focus { border-color: #6366f1; }
    }

    .cw-dir-select {
      height: 28px; padding: 0 6px;
      border: 1px solid var(--gray-200); border-radius: 8px;
      background: white; font-size: 0.75rem; color: var(--gray-700);
      cursor: pointer; outline: none;
    }

    .cw-text-wrap { flex: 1; display: flex; flex-direction: column; gap: 6px; }

    .cw-clue-input, .cw-answer-input {
      width: 100%; padding: 7px 10px;
      border: 1px solid var(--gray-200); border-radius: 8px;
      background: white; font-size: 0.88rem; color: var(--gray-900);
      outline: none; font-family: inherit;
      &::placeholder { color: var(--gray-400); }
      &:focus { border-color: #6366f1; }
    }

    .cw-answer-input {
      font-weight: 700; color: #059669;
      background: #ecfdf5; border-color: #6ee7b7;
      letter-spacing: 0.05em;
      &:focus { border-color: #059669; }
    }

    .cw-prev-summary {
      display: flex; gap: 12px; margin-top: 8px;
      font-size: 0.8rem; font-weight: 600; color: #4f46e5;
    }

    .prev-footer { border-top: 1px solid var(--gray-100); padding-top: 12px; }

    .prev-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.78rem; font-weight: 700; color: #b45309;
      background: #fef3c7; padding: 4px 12px; border-radius: 100px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    /* Side Actions */
    .side-actions { display: flex; flex-direction: column; gap: 8px; }

    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px 20px; border: none; border-radius: 12px;
      font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
      &.full { width: 100%; }
      mat-icon { font-size: 19px; width: 19px; height: 19px; }
      &.primary {
        background: linear-gradient(135deg, #fbbf24, #d97706);
        color: white; box-shadow: 0 4px 14px rgba(217,119,6,0.3);
        &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(217,119,6,0.4); }
        &:disabled { opacity: 0.6; cursor: not-allowed; background: var(--gray-300); box-shadow: none; }
      }
      &.secondary { background: var(--gray-100); color: var(--gray-700); &:hover { background: var(--gray-200); } }
    }

    .spin-loader {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class QuestionFormComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private questionService = inject(QuestionService);
  private assignmentService = inject(AssignmentService);
  private sanitizer = inject(DomSanitizer);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  jsonError = signal(false);
  showAdvanced = signal(false);
  questionType = signal<string>('multiple_choice');
  trueFalseAnswer = signal<boolean | null>(null);

  questionId = '';
  assignmentId = '';

  form: any = {
    question_text: '',
    points: 1,
    order_index: 0,
    explanation: ''
  };

  // Multiple choice
  options: string[] = ['', ''];
  correctAnswers: string[] = [];
  letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Short answer / Essay
  sampleAnswer = '';

  // Matching
  matchCorrects: string[] = [''];
  matchDistractors: string[] = [''];

  // Crossword
  crosswordGridImage = '';
  crosswordClues: { number: number; direction: 'across' | 'down'; text: string; answer: string }[] = [
    { number: 1, direction: 'across', text: '', answer: '' }
  ];

  questionDataStr = '{}';
  correctAnswerStr = '{}';

  typeIcon(): string {
    const map: Record<string, string> = {
      short_answer: 'edit_note',
      essay: 'article',
      true_false: 'rule',
      matching: 'compare_arrows',
      crossword: 'grid_on',
    };
    return map[this.questionType()] || 'quiz';
  }

  typeName(): string {
    const map: Record<string, string> = {
      short_answer: 'Qisqa javob',
      essay: 'Esse',
      true_false: "To'g'ri/Noto'g'ri",
      matching: 'Moslashtirish',
      crossword: 'Krossvord',
    };
    return map[this.questionType()] || this.questionType();
  }

  safeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
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

  private detectQuestionType(typeName: string, graderType?: string): string {
    const n = (typeName + ' ' + (graderType || '')).toLowerCase();
    if (n.includes('cross') || n.includes('kross')) return 'crossword';
    if (n.includes('true') || n.includes('false')) return 'true_false';
    if (n.includes('match')) return 'matching';
    if (n.includes('essay')) return 'essay';
    if (n.includes('short')) return 'short_answer';
    if (n.includes('multiple') || n.includes('choice') || n.includes('test')) return 'multiple_choice';
    return 'multiple_choice';
  }

  // ── Multiple Choice helpers ────────────────────────────────
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
      this.correctAnswers = [opt];
    }
    this.syncToJson();
  }

  updateCorrectOnRename(_event: Event, _i: number): void {
    this.syncToJson();
  }

  // ── Matching helpers ───────────────────────────────────────
  addMatchCorrect(): void { this.matchCorrects.push(''); }
  removeMatchCorrect(i: number): void { this.matchCorrects.splice(i, 1); }
  addMatchDistractor(): void { this.matchDistractors.push(''); }
  removeMatchDistractor(i: number): void { this.matchDistractors.splice(i, 1); }

  // ── Crossword helpers ──────────────────────────────────────
  addCrosswordClue(): void {
    const maxNum = this.crosswordClues.reduce((m, c) => Math.max(m, c.number), 0);
    this.crosswordClues.push({ number: maxNum + 1, direction: 'across', text: '', answer: '' });
  }
  removeCrosswordClue(i: number): void { this.crosswordClues.splice(i, 1); }

  crosswordAcross(): typeof this.crosswordClues { return this.crosswordClues.filter(c => c.direction === 'across'); }
  crosswordDown(): typeof this.crosswordClues { return this.crosswordClues.filter(c => c.direction === 'down'); }

  // ── JSON sync ──────────────────────────────────────────────
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

    // Load assignment type first
    if (this.assignmentId) {
      this.assignmentService.getById(this.assignmentId).subscribe({
        next: (a) => {
          const t = a.assignment_type;
          if (t) {
            this.questionType.set(this.detectQuestionType(t.name || '', t.grader_type || ''));
          }
        }
      });
    }

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

          // Detect type from question_data.type first (most reliable),
          // then fall back to assignment type
          const typeFromData = q.question_data?.type as string | undefined;
          const loadAnswers = (qt: string) => {
            if (qt === 'multiple_choice') {
              if (Array.isArray(q.question_data?.options)) {
                this.options = [...q.question_data.options];
                while (this.options.length < 2) this.options.push('');
              }
              const ans = q.correct_answer?.answer;
              if (Array.isArray(ans)) this.correctAnswers = [...ans];
              else if (ans) this.correctAnswers = [ans];

            } else if (qt === 'true_false') {
              const ans = q.correct_answer?.answer;
              if (ans === true || ans === 'true') this.trueFalseAnswer.set(true);
              else if (ans === false || ans === 'false') this.trueFalseAnswer.set(false);

            } else if (qt === 'short_answer' || qt === 'essay') {
              this.sampleAnswer = q.correct_answer?.answer || '';

            } else if (qt === 'matching') {
              const ans = q.correct_answer;
              if (Array.isArray(ans)) this.matchCorrects = [...ans];
              else if (ans) this.matchCorrects = [String(ans)];
              this.matchDistractors = q.question_data?.distractors?.length
                ? [...q.question_data.distractors] : [''];

            } else if (qt === 'crossword') {
              this.crosswordGridImage = q.question_data?.grid_image || '';
              if (Array.isArray(q.question_data?.clues) && q.question_data.clues.length) {
                this.crosswordClues = [...q.question_data.clues];
              }
            }
          };

          if (typeFromData) {
            // Type is embedded in question_data — use it directly
            this.questionType.set(typeFromData);
            loadAnswers(typeFromData);
            this.loading.set(false);
          } else {
            // Fall back to assignment type
            const assignmentIdToLoad = q.assignment || this.assignmentId;
            this.assignmentService.getById(assignmentIdToLoad).subscribe({
              next: (a) => {
                const t = a.assignment_type;
                const qt = t ? this.detectQuestionType(t.name || '', t.grader_type || '') : 'multiple_choice';
                this.questionType.set(qt);
                loadAnswers(qt);
                this.loading.set(false);
              },
              error: () => this.loading.set(false)
            });
          }

          this.questionDataStr = JSON.stringify(q.question_data, null, 2);
          this.correctAnswerStr = JSON.stringify(q.correct_answer, null, 2);
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
    this.saving.set(true);

    let questionData: any;
    let correctAnswer: any;
    const qt = this.questionType();

    if (qt === 'multiple_choice') {
      const filled = this.options.filter(o => o.trim());
      questionData = { type: 'multiple_choice', options: filled };
      correctAnswer = this.correctAnswers.length === 1
        ? { answer: this.correctAnswers[0] }
        : { answer: this.correctAnswers };

    } else if (qt === 'true_false') {
      questionData = { type: 'true_false' };
      correctAnswer = { answer: this.trueFalseAnswer() };

    } else if (qt === 'short_answer' || qt === 'essay') {
      questionData = { type: qt };
      correctAnswer = this.sampleAnswer ? { answer: this.sampleAnswer } : {};

    } else if (qt === 'matching') {
      const corrects = this.matchCorrects.filter(c => c.trim());
      const distractors = this.matchDistractors.filter(d => d.trim());
      questionData = { type: 'matching', distractors };
      correctAnswer = corrects.length === 1 ? corrects[0] : corrects;

    } else if (qt === 'crossword') {
      const clues = this.crosswordClues.filter(c => c.text.trim() && c.answer.trim());
      questionData = { type: 'crossword', grid_image: this.crosswordGridImage, clues };
      // correct_answer: map of "number_direction" -> answer for grading
      const answerMap: Record<string, string> = {};
      clues.forEach(c => { answerMap[`${c.number}_${c.direction}`] = c.answer.toUpperCase(); });
      correctAnswer = answerMap;

    } else {
      // Fallback: use raw JSON fields
      try {
        questionData = JSON.parse(this.questionDataStr);
        correctAnswer = JSON.parse(this.correctAnswerStr);
      } catch {
        this.jsonError.set(true);
        this.saving.set(false);
        return;
      }
    }

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
