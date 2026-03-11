import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AssignmentService } from '../../../core/services/assignment.service';
import { AssignmentType } from '../../../core/models/assignment.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-assignment-form',
  imports: [FormsModule, MatIconModule, MatSlideToggleModule, TranslatePipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-icon purple">
          <mat-icon>{{ isEdit() ? 'edit' : 'add_task' }}</mat-icon>
        </div>
        <div class="header-text">
          <h1>{{ (isEdit() ? 'assignments.edit' : 'assignments.add') | translate }}</h1>
          <p>{{ isEdit() ? 'Vazifa ma\'lumotlarini tahrirlash' : 'Yangi test yoki vazifa yaratish' }}</p>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="form-layout">

          <!-- Main Form -->
          <div class="form-main">

            <!-- Section 1: Asosiy -->
            <div class="form-card">
              <div class="section-head">
                <div class="sh-icon blue"><mat-icon>info</mat-icon></div>
                <div>
                  <h3>Asosiy ma'lumotlar</h3>
                  <p>Vazifa nomi, tavsif va turi</p>
                </div>
              </div>

              <div class="input-group">
                <label>{{ 'assignments.name' | translate }} <span class="req">*</span></label>
                <div class="input-wrap" [class.focused]="titleFocused"
                     [class.error]="titleRef.invalid && titleRef.touched">
                  <mat-icon>assignment</mat-icon>
                  <input [(ngModel)]="form.title" name="title"
                         placeholder="Masalan: 1-bob bo'yicha test"
                         required #titleRef="ngModel"
                         (focus)="titleFocused=true" (blur)="titleFocused=false">
                  @if (form.title) {
                    <span class="char-hint">{{ form.title.length }}/100</span>
                  }
                </div>
                @if (titleRef.invalid && titleRef.touched) {
                  <span class="err-msg"><mat-icon>error</mat-icon>Vazifa nomi kiritilishi shart</span>
                }
              </div>

              <div class="input-group">
                <label>{{ 'common.description' | translate }}</label>
                <div class="input-wrap textarea-wrap" [class.focused]="descFocused">
                  <mat-icon>notes</mat-icon>
                  <textarea [(ngModel)]="form.description" name="description"
                            rows="3" placeholder="Talabalar uchun qisqacha yo'riqnoma..."
                            (focus)="descFocused=true" (blur)="descFocused=false"></textarea>
                </div>
              </div>

              <!-- Type selector -->
              <div class="input-group">
                <label>{{ 'assignments.type' | translate }} <span class="req">*</span></label>
                @if (assignmentTypes().length > 0) {
                  <div class="type-grid">
                    @for (t of assignmentTypes(); track t.id) {
                      <div class="type-card" [class.selected]="form.assignment_type === t.id"
                           (click)="form.assignment_type = t.id">
                        <div class="tc-icon">
                          <mat-icon>{{ getTypeIcon(t.name) }}</mat-icon>
                        </div>
                        <div class="tc-info">
                          <span class="tc-name">{{ t.name }}</span>
                          @if (t.description) {
                            <span class="tc-desc">{{ t.description }}</span>
                          }
                          @if (t.is_auto_graded) {
                            <span class="tc-auto">
                              <mat-icon>auto_awesome</mat-icon>
                              Avtomatik tekshiriladi
                            </span>
                          }
                        </div>
                        <div class="tc-check">
                          @if (form.assignment_type === t.id) {
                            <mat-icon>check_circle</mat-icon>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="input-wrap select-wrap">
                    <mat-icon>category</mat-icon>
                    <select [(ngModel)]="form.assignment_type" name="assignment_type" required>
                      <option value="">Tur yuklanmoqda...</option>
                    </select>
                  </div>
                }
              </div>
            </div>

            <!-- Section 2: Sozlamalar -->
            <div class="form-card">
              <div class="section-head">
                <div class="sh-icon purple"><mat-icon>tune</mat-icon></div>
                <div>
                  <h3>Test sozlamalari</h3>
                  <p>Vaqt, urinish va tartib</p>
                </div>
              </div>

              <div class="settings-grid">

                <!-- Time Limit -->
                <div class="setting-item">
                  <div class="setting-icon orange">
                    <mat-icon>timer</mat-icon>
                  </div>
                  <div class="setting-body">
                    <label>Vaqt chegarasi</label>
                    <div class="setting-input">
                      <input type="number" [(ngModel)]="form.time_limit" name="time_limit"
                             placeholder="∞" min="0">
                      <span class="unit">daqiqa</span>
                    </div>
                    <span class="setting-hint">Bo'sh qoldiring = cheksiz vaqt</span>
                  </div>
                </div>

                <!-- Attempts -->
                <div class="setting-item">
                  <div class="setting-icon green">
                    <mat-icon>repeat</mat-icon>
                  </div>
                  <div class="setting-body">
                    <label>Urinishlar soni</label>
                    <div class="setting-input">
                      <input type="number" [(ngModel)]="form.attempts_allowed"
                             name="attempts_allowed" placeholder="1" min="1" max="99">
                      <span class="unit">marta</span>
                    </div>
                    <span class="setting-hint">Talaba necha marta topshira oladi</span>
                  </div>
                </div>

                <!-- Order -->
                <div class="setting-item">
                  <div class="setting-icon blue">
                    <mat-icon>sort</mat-icon>
                  </div>
                  <div class="setting-body">
                    <label>Tartib raqami</label>
                    <div class="setting-input">
                      <input type="number" [(ngModel)]="form.order_index"
                             name="order_index" placeholder="0" min="0">
                      <span class="unit">#</span>
                    </div>
                    <span class="setting-hint">Dars ichidagi tartib</span>
                  </div>
                </div>

              </div>

              <!-- Publish Toggle -->
              <div class="toggle-card" [class.active]="form.is_published">
                <div class="tc-left">
                  <div class="tc-icon-sm" [class.pub]="form.is_published">
                    <mat-icon>{{ form.is_published ? 'visibility' : 'visibility_off' }}</mat-icon>
                  </div>
                  <div>
                    <div class="tc-label">{{ form.is_published ? 'Faol (ko\'rinadi)' : 'Yashirin (qoralama)' }}</div>
                    <div class="tc-sub">{{ form.is_published
                      ? 'Talabalar bu vazifani koradi'
                      : 'Faqat siz korasiz' }}</div>
                  </div>
                </div>
                <mat-slide-toggle color="primary" [(ngModel)]="form.is_published"
                                  name="is_published" />
              </div>
            </div>

          </div>

          <!-- Sidebar -->
          <div class="form-side">

            <!-- Preview Card -->
            <div class="preview-card">
              <div class="prev-header">
                <mat-icon>preview</mat-icon>
                Ko'rinish
              </div>
              <div class="prev-body">
                <div class="prev-type-icon">
                  <mat-icon>{{ getTypeIcon(getTypeName(form.assignment_type)) }}</mat-icon>
                </div>
                <h4 class="prev-title">{{ form.title || 'Vazifa nomi...' }}</h4>
                @if (form.description) {
                  <p class="prev-desc">{{ form.description }}</p>
                }
                <div class="prev-badges">
                  @if (form.assignment_type) {
                    <span class="pb type">
                      <mat-icon>category</mat-icon>
                      {{ getTypeName(form.assignment_type) || 'Tur' }}
                    </span>
                  }
                  @if (form.time_limit) {
                    <span class="pb time">
                      <mat-icon>timer</mat-icon>
                      {{ form.time_limit }} min
                    </span>
                  } @else {
                    <span class="pb time">
                      <mat-icon>all_inclusive</mat-icon>
                      Cheksiz
                    </span>
                  }
                  <span class="pb attempts">
                    <mat-icon>repeat</mat-icon>
                    {{ form.attempts_allowed || 1 }}x urinish
                  </span>
                </div>
                <div class="prev-status" [class.pub]="form.is_published">
                  <mat-icon>{{ form.is_published ? 'check_circle' : 'schedule' }}</mat-icon>
                  {{ form.is_published ? 'Faol' : 'Qoralama' }}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="side-btns">
              <button class="btn secondary" type="button" (click)="goBack()">
                <mat-icon>close</mat-icon>
                Bekor qilish
              </button>
              <button class="btn primary" type="button"
                      (click)="onSave()"
                      [disabled]="saving() || !form.title || !form.assignment_type">
                @if (saving()) {
                  <div class="spin"></div>
                } @else {
                  <mat-icon>{{ isEdit() ? 'save' : 'add_task' }}</mat-icon>
                }
                {{ isEdit() ? ('common.save' | translate) : 'Yaratish' }}
              </button>
            </div>

            @if (isEdit()) {
              <a class="questions-link" (click)="goToQuestions()">
                <mat-icon>quiz</mat-icon>
                <span>Savollarni boshqarish</span>
                <mat-icon class="arrow">arrow_forward</mat-icon>
              </a>
            }

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
      display: flex; align-items: center; gap: 16px;
      margin-bottom: 28px; padding: 20px 24px;
      background: white; border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid var(--gray-100);
    }

    .back-btn {
      width: 42px; height: 42px; border: none;
      background: var(--gray-100); border-radius: 12px;
      cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      color: var(--gray-600); transition: all 0.2s; flex-shrink: 0;
      &:hover { background: var(--gray-200); transform: translateX(-3px); }
    }

    .header-icon {
      width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 24px; width: 24px; height: 24px; color: white; }
      &.purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); box-shadow: 0 4px 14px rgba(124,58,237,0.3); }
    }

    .header-text {
      h1 { font-size: 1.25rem; font-weight: 800; color: var(--gray-900); margin: 0; }
      p  { font-size: 0.82rem; color: var(--gray-500); margin: 3px 0 0; }
    }

    /* Layout */
    .form-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 24px;
      align-items: flex-start;
    }

    .form-main { display: flex; flex-direction: column; gap: 20px; }

    /* Form Card */
    .form-card {
      background: white; border-radius: 20px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      padding: 24px; display: flex; flex-direction: column; gap: 20px;
    }

    .section-head {
      display: flex; align-items: flex-start; gap: 14px;
      padding-bottom: 16px; border-bottom: 1px solid var(--gray-100);

      h3 { font-size: 1rem; font-weight: 700; color: var(--gray-900); margin: 0 0 3px; }
      p  { font-size: 0.78rem; color: var(--gray-500); margin: 0; }
    }

    .sh-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: white; }
      &.blue   { background: linear-gradient(135deg, #60a5fa, #2563eb); }
      &.purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
    }

    /* Input Group */
    .input-group {
      display: flex; flex-direction: column; gap: 8px;
      label { font-size: 0.85rem; font-weight: 600; color: var(--gray-700); .req { color: #e11d48; } }
    }

    .input-wrap {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; background: var(--gray-50);
      border: 2px solid var(--gray-200); border-radius: 12px;
      transition: all 0.18s; position: relative;

      &.focused { background: white; border-color: #8b5cf6; box-shadow: 0 0 0 3px #ede9fe; }
      &.error   { border-color: #ef4444; background: #fff5f5; }
      &.textarea-wrap { align-items: flex-start; padding-top: 14px; }
      &.select-wrap { cursor: pointer; }

      > mat-icon:first-child { font-size: 19px; width: 19px; height: 19px; color: var(--gray-400); flex-shrink: 0; }

      input, textarea, select {
        flex: 1; border: none; background: transparent;
        font-size: 0.93rem; color: var(--gray-900); outline: none; font-family: inherit;
        &::placeholder { color: var(--gray-400); }
      }
      textarea { resize: vertical; min-height: 80px; }
      select { appearance: none; cursor: pointer; }
    }

    .char-hint { font-size: 0.72rem; color: var(--gray-400); flex-shrink: 0; }

    .err-msg {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: #ef4444;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* Type Grid */
    .type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }

    .type-card {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; background: var(--gray-50);
      border: 2px solid var(--gray-200); border-radius: 14px;
      cursor: pointer; transition: all 0.18s;
      position: relative;

      &:hover { background: white; border-color: #c4b5fd; }

      &.selected {
        background: #faf5ff; border-color: #8b5cf6;
        box-shadow: 0 0 0 3px #ede9fe;
      }
    }

    .tc-icon {
      width: 38px; height: 38px; border-radius: 10px;
      background: var(--gray-200); display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--gray-600); }
    }

    .type-card.selected .tc-icon {
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      mat-icon { color: #7c3aed; }
    }

    .tc-info { flex: 1; min-width: 0; }
    .tc-name { display: block; font-size: 0.85rem; font-weight: 700; color: var(--gray-900); }
    .tc-desc { display: block; font-size: 0.72rem; color: var(--gray-500); margin-top: 2px;
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tc-auto {
      display: inline-flex; align-items: center; gap: 3px; margin-top: 4px;
      font-size: 0.68rem; font-weight: 600; color: #7c3aed;
      background: #ede9fe; padding: 2px 6px; border-radius: 100px;
      mat-icon { font-size: 10px; width: 10px; height: 10px; }
    }

    .tc-check {
      flex-shrink: 0;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #8b5cf6; }
    }

    /* Settings Grid */
    .settings-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    }

    .setting-item {
      display: flex; gap: 12px; padding: 14px;
      background: var(--gray-50); border-radius: 14px;
      border: 1px solid var(--gray-200);
    }

    .setting-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: white; }
      &.orange { background: linear-gradient(135deg, #fbbf24, #d97706); }
      &.green  { background: linear-gradient(135deg, #34d399, #059669); }
      &.blue   { background: linear-gradient(135deg, #60a5fa, #2563eb); }
    }

    .setting-body {
      flex: 1; display: flex; flex-direction: column; gap: 4px;
      label { font-size: 0.78rem; font-weight: 600; color: var(--gray-700); }
    }

    .setting-input {
      display: flex; align-items: center; gap: 6px;
      input {
        width: 100%; border: 1px solid var(--gray-200);
        background: white; border-radius: 8px;
        padding: 6px 8px; font-size: 0.9rem;
        font-weight: 600; color: var(--gray-900);
        outline: none; transition: border 0.15s;
        &:focus { border-color: #8b5cf6; }
      }
      .unit { font-size: 0.72rem; color: var(--gray-400); white-space: nowrap; }
    }

    .setting-hint { font-size: 0.68rem; color: var(--gray-400); line-height: 1.3; }

    /* Toggle Card */
    .toggle-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 18px; border-radius: 14px;
      background: var(--gray-50); border: 2px solid var(--gray-200);
      transition: all 0.18s;

      &.active {
        background: #f0fdf4; border-color: #bbf7d0;
      }
    }

    .tc-left { display: flex; align-items: center; gap: 14px; }

    .tc-icon-sm {
      width: 40px; height: 40px; border-radius: 12px;
      background: var(--gray-200); display: flex;
      align-items: center; justify-content: center;
      transition: all 0.18s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--gray-500); }

      &.pub {
        background: linear-gradient(135deg, #4ade80, #16a34a);
        mat-icon { color: white; }
      }
    }

    .tc-label { font-weight: 700; font-size: 0.9rem; color: var(--gray-900); }
    .tc-sub   { font-size: 0.78rem; color: var(--gray-500); margin-top: 2px; }

    /* Sidebar */
    .form-side {
      display: flex; flex-direction: column; gap: 16px;
      position: sticky; top: 16px;
    }

    /* Preview Card */
    .preview-card {
      background: white; border-radius: 20px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .prev-header {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 18px;
      background: linear-gradient(135deg, #faf5ff, #ede9fe);
      border-bottom: 1px solid #ddd6fe;
      font-size: 0.85rem; font-weight: 700; color: #6d28d9;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #8b5cf6; }
    }

    .prev-body { padding: 18px; }

    .prev-type-icon {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      border-radius: 14px; display: flex;
      align-items: center; justify-content: center;
      margin-bottom: 14px;
      mat-icon { font-size: 26px; width: 26px; height: 26px; color: #7c3aed; }
    }

    .prev-title {
      font-size: 1rem; font-weight: 700; color: var(--gray-900);
      margin: 0 0 8px; line-height: 1.35;
      min-height: 24px;
    }

    .prev-desc {
      font-size: 0.82rem; color: var(--gray-500);
      margin: 0 0 14px; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 3;
      -webkit-box-orient: vertical; overflow: hidden;
    }

    .prev-badges {
      display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;
    }

    .pb {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.72rem; font-weight: 600;
      padding: 4px 10px; border-radius: 100px;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }

      &.type    { background: #ede9fe; color: #7c3aed; }
      &.time    { background: #fef3c7; color: #92400e; }
      &.attempts{ background: #dbeafe; color: #1e40af; }
    }

    .prev-status {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 100px;
      font-size: 0.78rem; font-weight: 700;
      background: var(--gray-100); color: var(--gray-500);
      mat-icon { font-size: 15px; width: 15px; height: 15px; }

      &.pub { background: #dcfce7; color: #16a34a; }
    }

    /* Side Buttons */
    .side-btns { display: flex; flex-direction: column; gap: 8px; }

    .btn {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 12px 20px; border: none;
      border-radius: 12px; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s; width: 100%;
      mat-icon { font-size: 19px; width: 19px; height: 19px; }

      &.primary {
        background: linear-gradient(135deg, #8b5cf6, #6d28d9);
        color: white; box-shadow: 0 4px 14px rgba(109,40,217,0.3);
        &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(109,40,217,0.4); }
        &:disabled { opacity: 0.55; cursor: not-allowed; background: var(--gray-300); box-shadow: none; }
      }

      &.secondary {
        background: var(--gray-100); color: var(--gray-700);
        &:hover { background: var(--gray-200); }
      }
    }

    .spin {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Questions Link */
    .questions-link {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; background: #fef3c7;
      border: 1px solid #fde68a; border-radius: 14px;
      cursor: pointer; text-decoration: none;
      transition: all 0.18s; color: #92400e;
      font-size: 0.85rem; font-weight: 600;

      &:hover { background: #fde68a; transform: translateX(3px); }
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #d97706; }
      .arrow { margin-left: auto; }
    }

    @media (max-width: 960px) {
      .form-layout { grid-template-columns: 1fr; }
      .form-side { position: static; }
    }

    @media (max-width: 600px) {
      .settings-grid { grid-template-columns: 1fr; }
      .type-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AssignmentFormComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private assignmentService = inject(AssignmentService);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  assignmentId = '';
  lessonId = '';

  titleFocused = false;
  descFocused = false;

  form: any = {
    title: '',
    description: '',
    assignment_type: '',
    time_limit: null,
    attempts_allowed: 1,
    order_index: 0,
    is_published: false
  };

  assignmentTypes = signal<AssignmentType[]>([]);

  getTypeName(typeId: string): string {
    const t = this.assignmentTypes().find(t => t.id === typeId);
    return t?.name || '';
  }

  getTypeIcon(typeName: string): string {
    const n = (typeName || '').toLowerCase();
    if (n.includes('test') || n.includes('quiz')) return 'quiz';
    if (n.includes('homework') || n.includes('uy')) return 'home';
    if (n.includes('exam') || n.includes('imtihon')) return 'school';
    if (n.includes('practice') || n.includes('amaliy')) return 'build';
    return 'assignment';
  }

  ngOnInit(): void {
    this.lessonId = this.route.snapshot.queryParams['lesson_id'] || '';
    const id = this.route.snapshot.params['id'];

    this.assignmentService.getTypes().subscribe(types => this.assignmentTypes.set(types));

    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.assignmentId = id;
      this.loading.set(true);
      this.assignmentService.getById(id).subscribe({
        next: (a) => {
          this.lessonId = a.lesson;
          this.form = {
            title: a.title, description: a.description,
            assignment_type: a.assignment_type,
            time_limit: a.time_limit, attempts_allowed: a.attempts_allowed,
            order_index: a.order_index, is_published: a.is_published
          };
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  goBack(): void {
    if (this.lessonId) {
      this.router.navigate(['/lessons', this.lessonId, 'assignments']);
    } else {
      this.router.navigate(['/modules']);
    }
  }

  goToQuestions(): void {
    this.router.navigate(['/assignments', this.assignmentId, 'questions']);
  }

  onSave(): void {
    this.saving.set(true);
    if (this.isEdit()) {
      this.assignmentService.update(this.assignmentId, this.form).subscribe({
        next: () => this.goBack(),
        error: () => this.saving.set(false)
      });
    } else {
      this.assignmentService.create({ ...this.form, lesson: this.lessonId }).subscribe({
        next: () => this.goBack(),
        error: () => this.saving.set(false)
      });
    }
  }
}
