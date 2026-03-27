import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { lastValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { LessonService } from '../../../core/services/lesson.service';
import { ContentService } from '../../../core/services/content.service';
import { LessonContent, ContentType } from '../../../core/models/content.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LanguageService } from '../../../core/services/language.service';
import { QuillModule } from 'ngx-quill';
import Quill from 'quill';

// ── Font oilasi ──────────────────────────────────────────────
const FONT_LIST = ['', 'arial', 'times', 'courier', 'georgia', 'verdana', 'tahoma', 'trebuchet'];
try {
  const FontClass = Quill.import('attributors/class/font') as any;
  FontClass.whitelist = FONT_LIST.filter(f => f);
  Quill.register(FontClass, true);
} catch { /* already registered */ }

// ── Rasm formatini style atributi bilan kengaytirish ─────────
try {
  const BaseImg = Quill.import('formats/image') as any;
  class StyledImage extends BaseImg {
    static formats(node: HTMLElement): Record<string, string> {
      const f: Record<string, string> = super.formats ? super.formats(node) : {};
      if (node.getAttribute('style')) f['style'] = node.getAttribute('style')!;
      if (node.getAttribute('width')) f['width'] = node.getAttribute('width')!;
      return f;
    }
    format(name: string, value: string | null) {
      if (name === 'style' || name === 'width') {
        if (value) (this as any).domNode.setAttribute(name, value);
        else (this as any).domNode.removeAttribute(name);
      } else { super.format(name, value); }
    }
  }
  (StyledImage as any).blotName = 'image';
  (StyledImage as any).tagName  = 'IMG';
  Quill.register(StyledImage, true);
} catch { /* already registered */ }

@Component({
  selector: 'app-lesson-form',
  imports: [
    FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSlideToggleModule, MatIconModule, MatTabsModule,
    MatSelectModule, QuillModule,
    TranslatePipe, LoadingSpinnerComponent
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <button class="back-btn" (click)="goBack()" type="button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>{{ isEdit() ? 'edit' : 'add' }}</mat-icon>
          </div>
          <div class="header-text">
            <h1>{{ (isEdit() ? 'lessons.edit' : 'lessons.add') | translate }}</h1>
            <p>{{ isEdit() ? 'Dars ma\'lumotlarini yangilash' : 'Yangi dars yaratish' }}</p>
          </div>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="form-container">
          <mat-tab-group class="modern-tabs">
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>description</mat-icon>
                <span>{{ 'common.description' | translate }}</span>
              </ng-template>

              <div class="tab-content">
                <form (ngSubmit)="onSave()" #lessonForm="ngForm" class="modern-form">
                  <div class="form-section">
                    <h3 class="section-title">Asosiy ma'lumotlar</h3>
                    
                    <div class="input-group">
                      <label for="title">{{ 'lessons.name' | translate }} *</label>
                      <div class="input-wrapper" [class.error]="title.invalid && title.touched">
                        <mat-icon>title</mat-icon>
                        <input id="title" [(ngModel)]="form.title" name="title" 
                               placeholder="Dars nomini kiriting" required #title="ngModel">
                      </div>
                      @if (title.invalid && title.touched) {
                        <span class="error-text">Dars nomi kiritilishi shart</span>
                      }
                    </div>

                    <div class="input-group">
                      <label>{{ 'common.description' | translate }}</label>
                      <quill-editor
                        [(ngModel)]="form.description"
                        name="description"
                        [modules]="quillModules"
                        placeholder="Dars haqida qisqacha ma'lumot"
                        class="quill-editor"
                        (onEditorCreated)="onDescriptionEditorCreated($event)">
                      </quill-editor>
                    </div>

                    <div class="form-grid">
                      <div class="input-group">
                        <label for="order">{{ 'common.order' | translate }}</label>
                        <div class="input-wrapper">
                          <mat-icon>sort</mat-icon>
                          <input id="order" type="number" [(ngModel)]="form.order_index" name="order_index" 
                                 placeholder="0">
                        </div>
                      </div>

                      <div class="input-group">
                        <label for="completion">{{ 'lessons.completionPercent' | translate }}</label>
                        <div class="input-wrapper">
                          <mat-icon>speed</mat-icon>
                          <input id="completion" type="number" [(ngModel)]="form.required_completion_percent" 
                                 name="required_completion_percent" placeholder="80">
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="form-section">
                    <h3 class="section-title">Sozlamalar</h3>
                    
                    <div class="toggle-group">
                      <div class="toggle-item">
                        <div class="toggle-info">
                          <mat-icon [class.active]="form.is_sequential">playlist_play</mat-icon>
                          <div>
                            <span class="toggle-label">{{ 'lessons.sequential' | translate }}</span>
                            <span class="toggle-desc">Mavzular tartib bilan o'tiladi</span>
                          </div>
                        </div>
                        <mat-slide-toggle color="primary" [(ngModel)]="form.is_sequential" name="is_sequential"></mat-slide-toggle>
                      </div>

                      <div class="toggle-item">
                        <div class="toggle-info">
                          <mat-icon [class.active]="form.is_published">visibility</mat-icon>
                          <div>
                            <span class="toggle-label">{{ 'common.published' | translate }}</span>
                            <span class="toggle-desc">Dars talabalarga ko'rinadi</span>
                          </div>
                        </div>
                        <mat-slide-toggle color="primary" [(ngModel)]="form.is_published" name="is_published"></mat-slide-toggle>
                      </div>
                    </div>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="btn btn-secondary" (click)="goBack()">
                      <mat-icon>close</mat-icon>
                      {{ 'common.cancel' | translate }}
                    </button>
                    <button type="submit" class="btn btn-primary" [disabled]="saving() || lessonForm.invalid">
                      @if (saving()) {
                        <div class="btn-loader"></div>
                      } @else {
                        <mat-icon>save</mat-icon>
                      }
                      {{ 'common.save' | translate }}
                    </button>
                  </div>
                </form>
              </div>
            </mat-tab>

            @if (isEdit()) {
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>folder</mat-icon>
                  <span>{{ 'lessons.contents' | translate }}</span>
                </ng-template>

                <div class="tab-content">
                  <div class="content-header">
                    <h3>{{ 'content.title' | translate }}</h3>
                    <button class="add-content-btn" (click)="showContentForm.set(true)">
                      <mat-icon>add</mat-icon>
                      {{ 'content.add' | translate }}
                    </button>
                  </div>

                  @if (showContentForm()) {
                    <div class="content-form-card animate-scale-in">
                      <div class="form-grid">
                        <div class="input-group">
                          <label>{{ 'common.title' | translate }}</label>
                          <div class="input-wrapper">
                            <mat-icon>label</mat-icon>
                            <input [(ngModel)]="contentForm.title" placeholder="Kontent sarlavhasi">
                          </div>
                        </div>

                        <div class="input-group">
                          <label>{{ 'content.type' | translate }}</label>
                          <div class="input-wrapper select-wrapper">
                            <mat-icon>category</mat-icon>
                            <select [(ngModel)]="contentForm.content_type">
                              <option value="">Turni tanlang</option>
                              @for (ct of contentTypes(); track ct.id) {
                                <option [value]="ct.id">{{ ct.name }}</option>
                              }
                            </select>
                          </div>
                        </div>
                      </div>

                      <!-- Matn uchun Quill editor -->
                      <div class="input-group">
                        <label>{{ 'content.text' | translate }}</label>
                        <quill-editor
                          [(ngModel)]="contentForm.content"
                          name="contentText"
                          [modules]="contentQuillModules"
                          placeholder="Kontent matnini kiriting..."
                          class="content-quill-editor"
                          (onEditorCreated)="onContentEditorCreated($event)">
                        </quill-editor>
                      </div>

                      <!-- Video URL -->
                      <div class="input-group">
                        <label>{{ 'content.videoUrl' | translate }}</label>
                        <div class="input-wrapper">
                          <mat-icon>videocam</mat-icon>
                          <input [(ngModel)]="contentForm.video_url" placeholder="https://youtube.com/...">
                        </div>
                      </div>

                      <!-- Fayl yuklash -->
                      <div class="input-group">
                        <label>Fayl yuklash</label>
                        <div class="file-upload-area"
                          [class.has-file]="contentForm.file_url"
                          [class.uploading]="uploadingFile()"
                          (click)="fileInput.click()"
                          (dragover)="$event.preventDefault()"
                          (drop)="onFileDrop($event)">
                          <input #fileInput type="file" hidden (change)="onFileSelect($event)">

                          @if (uploadingFile()) {
                            <div class="upload-state">
                              <div class="upload-spinner"></div>
                              <span>Yuklanmoqda...</span>
                            </div>
                          } @else if (contentForm.file_url) {
                            <div class="upload-state success">
                              <mat-icon>check_circle</mat-icon>
                              <div class="file-info">
                                <span class="file-name">{{ uploadedFileName() }}</span>
                                <span class="file-url-preview">{{ contentForm.file_url }}</span>
                              </div>
                              <button class="remove-file-btn" (click)="removeFile($event)">
                                <mat-icon>close</mat-icon>
                              </button>
                            </div>
                          } @else {
                            <div class="upload-state idle">
                              <div class="upload-icon-wrap">
                                <mat-icon>cloud_upload</mat-icon>
                              </div>
                              <div>
                                <span class="upload-title">Faylni suring yoki bosing</span>
                                <span class="upload-sub">PDF, DOC, DOCX, PPT, XLSX, JPG, PNG — max 50MB</span>
                              </div>
                            </div>
                          }
                        </div>
                        @if (uploadError()) {
                          <span class="error-text">{{ uploadError() }}</span>
                        }
                      </div>

                      <div class="content-form-actions">
                        <button class="btn btn-secondary" (click)="showContentForm.set(false); editingContentId.set(null); contentForm = { title: '', content_type: '', content: '', video_url: '', file_url: '' }; uploadedFileName.set(''); uploadError.set('')">
                          <mat-icon>close</mat-icon>
                          {{ 'common.cancel' | translate }}
                        </button>
                        <button class="btn btn-primary" (click)="saveContent()" [disabled]="uploadingFile()">
                          <mat-icon>save</mat-icon>
                          {{ 'common.save' | translate }}
                        </button>
                      </div>
                    </div>
                  }

                  @if (contents().length === 0) {
                    <div class="empty-content">
                      <div class="empty-icon">
                        <mat-icon>folder_open</mat-icon>
                      </div>
                      <p>Hozircha kontent mavjud emas</p>
                    </div>
                  } @else {
                    <div class="content-list">
                      @for (c of contents(); track c.id) {
                        <div class="content-item">
                          <div class="content-icon">
                            <mat-icon>{{ getContentIcon(c.type_name) }}</mat-icon>
                          </div>
                          <div class="content-info">
                            <span class="content-title">{{ c.title }}</span>
                            <span class="content-type">{{ c.type_name }}</span>
                          </div>
                          <button class="action-btn edit" (click)="editContent(c)">
                            <mat-icon>edit</mat-icon>
                          </button>
                          <button class="action-btn delete" (click)="deleteContent(c.id)">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              </mat-tab>
            }
          </mat-tab-group>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      animation: fadeIn 0.5s ease-out;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
      padding: 24px;
      background: var(--white);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--gray-100);
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

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }
    }

    .header-text {
      h1 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--gray-900);
        margin: 0;
      }

      p {
        font-size: 0.85rem;
        color: var(--gray-500);
        margin: 4px 0 0;
      }
    }

    .form-container {
      background: var(--white);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--gray-100);
      overflow: hidden;
      animation: fadeInUp 0.5s ease-out;
    }

    ::ng-deep .modern-tabs {
      .mat-mdc-tab-header {
        background: var(--gray-50);
        border-bottom: 1px solid var(--gray-200);
      }

      .mat-mdc-tab {
        min-width: 160px;
        height: 56px;

        .mdc-tab__content {
          gap: 8px;
        }

        .mdc-tab__text-label {
          font-weight: 600;
          font-size: 0.95rem;
        }
      }

      .mat-mdc-tab-body-wrapper {
        padding: 0;
      }
    }

    .tab-content {
      padding: 32px;
    }

    .modern-form {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--gray-900);
      margin: 0;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--gray-100);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .quill-editor {
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1.5px solid var(--gray-200);
      transition: border-color 0.2s;

      &:focus-within {
        border-color: var(--primary-400);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      ::ng-deep .ql-toolbar {
        border: none;
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-50);
        padding: 8px 12px;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      }

      ::ng-deep .ql-container {
        border: none;
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
        min-height: 160px;
      }

      ::ng-deep .ql-editor {
        min-height: 160px;
        padding: 14px 16px;
        color: var(--gray-800);

        &.ql-blank::before {
          color: var(--gray-400);
          font-style: normal;
        }
      }
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--gray-700);
      }
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--gray-50);
      border: 2px solid var(--gray-200);
      border-radius: var(--radius-lg);
      transition: all var(--transition);

      &:focus-within {
        background: var(--white);
        border-color: var(--primary-500);
        box-shadow: 0 0 0 4px var(--primary-100);
      }

      &.error {
        border-color: var(--error);
        background: #fffafa;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--gray-400);
      }

      input, textarea, select {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.95rem;
        color: var(--gray-900);
        outline: none;
        font-family: inherit;

        &::placeholder {
          color: var(--gray-400);
        }
      }

      textarea {
        resize: vertical;
        min-height: 100px;
      }

      &.textarea-wrapper {
        align-items: flex-start;
        padding-top: 14px;
      }

      &.select-wrapper select {
        appearance: none;
        cursor: pointer;
      }
    }

    .error-text {
      font-size: 0.75rem;
      color: var(--error);
      margin-top: 4px;
    }

    .toggle-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .toggle-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: var(--gray-50);
      border-radius: var(--radius-lg);
      border: 1px solid var(--gray-200);
      transition: all var(--transition);

      &:hover {
        background: #fdfdfd;
        border-color: var(--primary-200);
      }
    }

    .toggle-info {
      display: flex;
      align-items: center;
      gap: 16px;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--gray-400);
        transition: color var(--transition);

        &.active {
          color: var(--primary-500);
        }
      }
    }

    .toggle-label {
      display: block;
      font-weight: 600;
      color: var(--gray-900);
    }

    .toggle-desc {
      display: block;
      font-size: 0.8rem;
      color: var(--gray-500);
      margin-top: 2px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid var(--gray-100);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: var(--radius-lg);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &.btn-primary {
        background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: var(--gray-400);
          box-shadow: none;
        }
      }

      &.btn-secondary {
        background: var(--gray-100);
        color: var(--gray-700);

        &:hover {
          background: var(--gray-200);
          color: var(--gray-900);
        }
      }
    }

    .btn-loader {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Content Management */
    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--gray-900);
        margin: 0;
      }
    }

    .add-content-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--primary-50);
      color: var(--primary-600);
      border: 1px solid var(--primary-100);
      border-radius: var(--radius-lg);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);

      &:hover {
        background: var(--primary-100);
        transform: translateY(-2px);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .content-form-card {
      background: var(--gray-50);
      border: 2px solid var(--gray-200);
      border-radius: var(--radius-xl);
      padding: 24px;
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .content-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 20px;
      border-top: 1px solid var(--gray-200);
    }

    .empty-content {
      text-align: center;
      padding: 64px 24px;
      color: var(--gray-400);

      .empty-icon {
        width: 64px;
        height: 64px;
        background: var(--gray-100);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;

        mat-icon {
          font-size: 32px;
          color: var(--gray-300);
        }
      }

      p {
        font-size: 0.95rem;
        margin: 0;
      }
    }

    .content-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .content-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius-lg);
      transition: all var(--transition);

      &:hover {
        border-color: var(--primary-200);
        box-shadow: var(--shadow-sm);
        transform: scale(1.01);
      }
    }

    .content-icon {
      width: 44px;
      height: 44px;
      background: var(--primary-50);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: var(--primary-600);
      }
    }

    .content-info {
      flex: 1;
    }

    .content-title {
      display: block;
      font-weight: 600;
      color: var(--gray-900);
    }

    .content-type {
      display: block;
      font-size: 0.8rem;
      color: var(--gray-500);
      margin-top: 2px;
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

      &.edit {
        background: var(--primary-50);
        color: var(--primary-600);

        &:hover {
          background: var(--primary-100);
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

    /* Content Quill editor */
    .content-quill-editor {
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1.5px solid var(--gray-200);
      transition: border-color 0.2s;

      &:focus-within {
        border-color: var(--primary-400);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      ::ng-deep .ql-toolbar {
        border: none;
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-50);
        padding: 8px 12px;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        flex-wrap: wrap;
        gap: 2px;
      }

      ::ng-deep .ql-container {
        border: none;
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
        min-height: 220px;
      }

      ::ng-deep .ql-editor {
        min-height: 220px;
        padding: 14px 16px;
        color: var(--gray-800);
        line-height: 1.7;

        &.ql-blank::before {
          color: var(--gray-400);
          font-style: normal;
        }

        h1, h2, h3 { color: var(--gray-900); margin: 12px 0 6px; }
        p { margin: 0 0 8px; }
        ul, ol { padding-left: 20px; margin: 8px 0; }
        blockquote {
          border-left: 3px solid var(--primary-400);
          padding: 8px 12px;
          background: var(--primary-50);
          border-radius: 0 var(--radius) var(--radius) 0;
          color: var(--gray-700);
          margin: 10px 0;
        }
        pre {
          background: var(--gray-900);
          color: #e2e8f0;
          padding: 14px 16px;
          border-radius: var(--radius);
          font-size: 0.875rem;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          td, th {
            border: 1px solid var(--gray-200);
            padding: 8px 12px;
          }
          th { background: var(--gray-50); font-weight: 600; }
        }
      }
    }

    /* ── Font oilalari ─────────────────────────────── */
    ::ng-deep {
      .ql-font-arial      span, .ql-font-arial      { font-family: Arial, sans-serif !important; }
      .ql-font-times      span, .ql-font-times      { font-family: 'Times New Roman', serif !important; }
      .ql-font-courier    span, .ql-font-courier    { font-family: 'Courier New', monospace !important; }
      .ql-font-georgia    span, .ql-font-georgia    { font-family: Georgia, serif !important; }
      .ql-font-verdana    span, .ql-font-verdana    { font-family: Verdana, sans-serif !important; }
      .ql-font-tahoma     span, .ql-font-tahoma     { font-family: Tahoma, sans-serif !important; }
      .ql-font-trebuchet  span, .ql-font-trebuchet  { font-family: 'Trebuchet MS', sans-serif !important; }

      /* Editor ichidagi font class lar */
      .ql-editor .ql-font-arial     { font-family: Arial, sans-serif; }
      .ql-editor .ql-font-times     { font-family: 'Times New Roman', serif; }
      .ql-editor .ql-font-courier   { font-family: 'Courier New', monospace; }
      .ql-editor .ql-font-georgia   { font-family: Georgia, serif; }
      .ql-editor .ql-font-verdana   { font-family: Verdana, sans-serif; }
      .ql-editor .ql-font-tahoma    { font-family: Tahoma, sans-serif; }
      .ql-editor .ql-font-trebuchet { font-family: 'Trebuchet MS', sans-serif; }

      /* Font picker label (toolbar dropdown) */
      .ql-font .ql-picker-label::before      { content: 'Shrift'; }
      .ql-font .ql-picker-item[data-value="arial"]::before     { content: 'Arial'; font-family: Arial; }
      .ql-font .ql-picker-item[data-value="times"]::before     { content: 'Times New Roman'; font-family: 'Times New Roman'; }
      .ql-font .ql-picker-item[data-value="courier"]::before   { content: 'Courier New'; font-family: 'Courier New'; }
      .ql-font .ql-picker-item[data-value="georgia"]::before   { content: 'Georgia'; font-family: Georgia; }
      .ql-font .ql-picker-item[data-value="verdana"]::before   { content: 'Verdana'; font-family: Verdana; }
      .ql-font .ql-picker-item[data-value="tahoma"]::before    { content: 'Tahoma'; font-family: Tahoma; }
      .ql-font .ql-picker-item[data-value="trebuchet"]::before { content: 'Trebuchet MS'; font-family: 'Trebuchet MS'; }

      /* Rasm tanlanganda outline */
      .ql-editor img.ql-img-selected { outline: 2px solid #6366f1; outline-offset: 2px; cursor: move; }
    }

    /* File upload area */
    .file-upload-area {
      border: 2px dashed var(--gray-300);
      border-radius: var(--radius-xl);
      padding: 24px;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--gray-50);

      &:hover, &.uploading {
        border-color: var(--primary-400);
        background: var(--primary-50);
      }

      &.has-file {
        border-style: solid;
        border-color: var(--success, #10b981);
        background: #f0fdf4;
        cursor: default;
      }
    }

    .upload-state {
      display: flex;
      align-items: center;
      gap: 16px;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
      }

      &.success mat-icon { color: #10b981; }
      &.idle mat-icon { color: var(--primary-500); }
    }

    .upload-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-lg);
      background: var(--primary-100);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: var(--primary-600);
      }
    }

    .upload-title {
      display: block;
      font-weight: 600;
      color: var(--gray-800);
      font-size: 0.95rem;
    }

    .upload-sub {
      display: block;
      font-size: 0.78rem;
      color: var(--gray-500);
      margin-top: 4px;
    }

    .upload-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--primary-100);
      border-top-color: var(--primary-500);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    .file-info {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      display: block;
      font-weight: 600;
      color: var(--gray-900);
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-url-preview {
      display: block;
      font-size: 0.75rem;
      color: var(--gray-500);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .remove-file-btn {
      width: 30px;
      height: 30px;
      border: none;
      background: #fee2e2;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #dc2626;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &:hover { background: #fecaca; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes animateScaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .animate-scale-in {
      animation: animateScaleIn 0.3s ease-out forwards;
    }
  `]
})
export class LessonFormComponent implements OnInit, OnDestroy {
  private _imgToolbars: HTMLElement[] = [];
  router = inject(Router);
  lang = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private lessonService = inject(LessonService);
  private contentService = inject(ContentService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  quillModules = {
    toolbar: [
      [{ font: FONT_LIST.filter(f => f) }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ script: 'sub' }, { script: 'super' }],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: { matchVisual: false }
  };

  contentQuillModules = {
    toolbar: [
      [{ font: FONT_LIST.filter(f => f) }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ script: 'sub' }, { script: 'super' }],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: { matchVisual: false }
  };

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  lessonId = '';
  moduleId = '';

  form: any = {
    title: '',
    description: '',
    order_index: 0,
    required_completion_percent: 80,
    is_sequential: false,
    is_published: false
  };

  showContentForm = signal(false);
  contentTypes = signal<ContentType[]>([]);
  contents = signal<LessonContent[]>([]);
  contentForm: any = { title: '', content_type: '', content: '', video_url: '', file_url: '' };

  uploadingFile = signal(false);
  uploadError = signal('');
  uploadedFileName = signal('');
  editingContentId = signal<string | null>(null);
  onDescriptionEditorCreated(quill: any) {
    quill.root.addEventListener('paste', (e: ClipboardEvent) => {
      const html = e.clipboardData?.getData('text/html');
      if (html && (html.includes('data:image') || html.includes('<img'))) {
        e.preventDefault();
        e.stopPropagation();
        this.processPastedHtml(quill, html);
      }
    }, true);
    this.setupImageToolbar(quill);
  }

  onContentEditorCreated(quill: any) {
    quill.root.addEventListener('paste', (e: ClipboardEvent) => {
      const html = e.clipboardData?.getData('text/html');
      if (html && (html.includes('data:image') || html.includes('<img'))) {
        e.preventDefault();
        e.stopPropagation();
        this.processPastedHtml(quill, html);
      }
    }, true);
    this.setupImageToolbar(quill);
  }

  private async processPastedHtml(quill: any, html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = Array.from(doc.querySelectorAll('img[src^="data:"]'));

    await Promise.all(images.map(async (img) => {
      const src = img.getAttribute('src')!;
      try {
        const blob = this.dataURItoBlob(src);
        const file = new File([blob], 'pasted-image.png', { type: blob.type });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('_token', environment.uploadToken);
        const res = await lastValueFrom(this.http.post<{ url: string }>(environment.uploadUrl, formData));
        if (res?.url) img.setAttribute('src', res.url);
      } catch { /* base64 saqlanib qoladi */ }
    }));

    const range = quill.getSelection(true) || { index: quill.getLength() - 1 };
    quill.clipboard.dangerouslyPasteHTML(range.index, doc.body.innerHTML);
  }

  private dataURItoBlob(dataURI: string): Blob {
    const [header, data] = dataURI.split(',');
    const mime = header.split(':')[1].split(';')[0];
    const bytes = atob(data);
    const ab = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) ab[i] = bytes.charCodeAt(i);
    return new Blob([ab], { type: mime });
  }

  ngOnInit(): void {
    this.moduleId = this.route.snapshot.queryParams['module_id'] || '';
    const id = this.route.snapshot.params['id'];

    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.lessonId = id;
      this.loading.set(true);
      this.lessonService.getById(id).subscribe({
        next: (lesson) => {
          this.moduleId = lesson.module;
          this.form = {
            title: lesson.title, description: lesson.description, order_index: lesson.order_index,
            required_completion_percent: lesson.required_completion_percent,
            is_sequential: lesson.is_sequential, is_published: lesson.is_published
          };
          this.contents.set(lesson.contents || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
      this.contentService.getContentTypes().subscribe(types => this.contentTypes.set(types));
    }
  }

  goBack(): void {
    if (this.moduleId) {
      this.router.navigate(['/modules', this.moduleId, 'lessons']);
    } else {
      this.router.navigate(['/modules']);
    }
  }

  onSave(): void {
    this.saving.set(true);
    if (this.isEdit()) {
      this.lessonService.update(this.lessonId, this.form).subscribe({
        next: () => this.goBack(),
        error: () => this.saving.set(false)
      });
    } else {
      this.lessonService.create({ ...this.form, module: this.moduleId }).subscribe({
        next: () => this.goBack(),
        error: () => this.saving.set(false)
      });
    }
  }

  editContent(c: LessonContent): void {
    this.editingContentId.set(c.id);
    this.contentForm = {
      title: c.title,
      content_type: typeof c.content_type === 'object' ? (c.content_type as any)?.id : c.content_type,
      content: c.content || '',
      video_url: c.video_url || '',
      file_url: c.file_url || ''
    };
    this.uploadedFileName.set(c.file_url ? c.file_url.split('/').pop() || '' : '');
    this.uploadError.set('');
    this.showContentForm.set(true);
  }

  saveContent(): void {
    const editId = this.editingContentId();
    const payload: any = {
      title: this.contentForm.title,
      content_type: this.contentForm.content_type || null,
      content: this.contentForm.content || null,
      video_url: this.contentForm.video_url || null,
      file_url: this.contentForm.file_url || null,
    };
    if (!editId) payload.lesson = this.lessonId;

    const action = editId
      ? this.contentService.updateLessonContent(editId, payload)
      : this.contentService.createLessonContent(payload);

    action.subscribe({
      next: (c) => {
        if (editId) {
          this.contents.update(list => list.map(item => item.id === editId ? c : item));
        } else {
          this.contents.update(list => [...list, c]);
        }
        this.showContentForm.set(false);
        this.editingContentId.set(null);
        this.contentForm = { title: '', content_type: '', content: '', video_url: '', file_url: '' };
        this.uploadedFileName.set('');
        this.uploadError.set('');
      }
    });
  }

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadFile(file);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.uploadError.set('Fayl hajmi 50MB dan oshmasligi kerak');
      return;
    }
    this.uploadError.set('');
    this.uploadingFile.set(true);
    this.uploadedFileName.set(file.name);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('_token', environment.uploadToken);

    this.http.post<{ url: string }>(environment.uploadUrl, formData).subscribe({
      next: (res) => {
        this.contentForm.file_url = res.url;
        this.uploadingFile.set(false);
      },
      error: () => {
        this.uploadError.set('Fayl yuklanmadi. Qayta urinib ko\'ring.');
        this.uploadingFile.set(false);
        this.uploadedFileName.set('');
      }
    });
  }

  removeFile(event: MouseEvent): void {
    event.stopPropagation();
    this.contentForm.file_url = '';
    this.uploadedFileName.set('');
    this.uploadError.set('');
  }

  deleteContent(id: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: this.lang.t('dialog.confirmTitle'), message: this.lang.t('content.deleteConfirm') }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.contentService.deleteLessonContent(id).subscribe(() => {
          this.contents.update(list => list.filter(c => c.id !== id));
        });
      }
    });
  }

  getContentIcon(typeName: string | undefined): string {
    const icons: Record<string, string> = {
      'video': 'videocam',
      'text': 'article',
      'file': 'attach_file',
      'image': 'image',
      'audio': 'audiotrack'
    };
    return icons[typeName?.toLowerCase() || ''] || 'description';
  }

  private setupImageToolbar(quill: any): void {
    const bar = document.createElement('div');
    bar.className = 'ql-img-floatbar';
    bar.innerHTML = `
      <span class="ql-img-bar-label">Joylashuv:</span>
      <button title="Chapga" data-ac="left">◀ Chap</button>
      <button title="Markaz" data-ac="center">▬ Markaz</button>
      <button title="O'ngga" data-ac="right">O'ng ▶</button>
      <button title="Oddiy" data-ac="none">× Bekor</button>
      <span class="ql-img-bar-sep"></span>
      <button title="Kichraytir" data-ac="shrink" class="ql-img-sz-btn">−</button>
      <span class="ql-img-sz-lbl">100%</span>
      <button title="Kattalashtir" data-ac="grow" class="ql-img-sz-btn">+</button>
      <span class="ql-img-bar-sep"></span>
      <button title="To'liq kenglik" data-ac="full">⟷</button>
    `;
    document.body.appendChild(bar);
    this._imgToolbars.push(bar);

    let activeImg: HTMLImageElement | null = null;
    const szLbl = bar.querySelector('.ql-img-sz-lbl') as HTMLElement;

    const updatePct = () => {
      if (!activeImg) return;
      const cw = activeImg.parentElement?.clientWidth || 600;
      const w  = activeImg.width || cw;
      szLbl.textContent = `${Math.round((w / cw) * 100)}%`;
    };

    const reposition = () => {
      if (!activeImg) return;
      const r = activeImg.getBoundingClientRect();
      const top = r.top - 42;
      bar.style.top  = `${top < 4 ? r.bottom + 4 : top}px`;
      bar.style.left = `${Math.max(4, r.left)}px`;
    };

    quill.root.addEventListener('click', (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'IMG') {
        activeImg = t as HTMLImageElement;
        updatePct();
        bar.style.display = 'flex';
        reposition();
        quill.root.querySelectorAll('img').forEach((im: HTMLImageElement) =>
          im.classList.remove('ql-img-selected'));
        activeImg.classList.add('ql-img-selected');
      } else {
        bar.style.display = 'none';
        activeImg?.classList.remove('ql-img-selected');
        activeImg = null;
      }
    });

    const _scroll = () => { if (activeImg) reposition(); };
    document.addEventListener('scroll', _scroll, true);
    window.addEventListener('resize', _scroll);

    document.addEventListener('click', (e: MouseEvent) => {
      if (activeImg && !quill.root.contains(e.target as Node) && !bar.contains(e.target as Node)) {
        bar.style.display = 'none';
        activeImg.classList.remove('ql-img-selected');
        activeImg = null;
      }
    });

    bar.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      const btn = (e.target as HTMLElement).closest('[data-ac]') as HTMLElement;
      if (!btn || !activeImg) return;
      const ac = btn.dataset['ac'];
      const cw = activeImg.parentElement?.clientWidth || 600;
      const w  = activeImg.clientWidth || cw;
      const step = Math.max(40, Math.round(w * 0.1));
      switch (ac) {
        case 'left':   activeImg.style.cssText = `float:left; margin:0 16px 8px 0; display:inline; max-width:60%;`; break;
        case 'center': activeImg.style.cssText = `display:block; margin:8px auto; float:none;`; break;
        case 'right':  activeImg.style.cssText = `float:right; margin:0 0 8px 16px; display:inline; max-width:60%;`; break;
        case 'none':   activeImg.removeAttribute('style'); break;
        case 'full':   activeImg.style.cssText = `display:block; width:100%; height:auto; float:none; margin:8px 0;`; break;
        case 'shrink':
          activeImg.style.width  = `${Math.max(60, w - step)}px`;
          activeImg.style.height = 'auto';
          break;
        case 'grow':
          activeImg.style.width  = `${Math.min(cw, w + step)}px`;
          activeImg.style.height = 'auto';
          break;
      }
      updatePct();
      reposition();
    });
  }

  ngOnDestroy(): void {
    this._imgToolbars.forEach(el => el.parentNode?.removeChild(el));
    this._imgToolbars = [];
  }
}
