import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-lesson-form',
  imports: [
    FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSlideToggleModule, MatIconModule, MatTabsModule,
    MatSelectModule,
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
                      <label for="description">{{ 'common.description' | translate }}</label>
                      <div class="input-wrapper textarea-wrapper">
                        <mat-icon>notes</mat-icon>
                        <textarea id="description" [(ngModel)]="form.description" name="description" 
                                  rows="4" placeholder="Dars haqida qisqacha ma'lumot"></textarea>
                      </div>
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

                      <div class="input-group">
                        <label>{{ 'content.text' | translate }}</label>
                        <div class="input-wrapper textarea-wrapper">
                          <mat-icon>article</mat-icon>
                          <textarea [(ngModel)]="contentForm.content" rows="3" placeholder="Kontent matni"></textarea>
                        </div>
                      </div>

                      <div class="form-grid">
                        <div class="input-group">
                          <label>{{ 'content.videoUrl' | translate }}</label>
                          <div class="input-wrapper">
                            <mat-icon>videocam</mat-icon>
                            <input [(ngModel)]="contentForm.video_url" placeholder="Video URL">
                          </div>
                        </div>

                        <div class="input-group">
                          <label>{{ 'content.fileUrl' | translate }}</label>
                          <div class="input-wrapper">
                            <mat-icon>attach_file</mat-icon>
                            <input [(ngModel)]="contentForm.file_url" placeholder="Fayl URL">
                          </div>
                        </div>
                      </div>

                      <div class="content-form-actions">
                        <button class="btn btn-secondary" (click)="showContentForm.set(false)">
                          <mat-icon>close</mat-icon>
                          {{ 'common.cancel' | translate }}
                        </button>
                        <button class="btn btn-primary" (click)="saveContent()">
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

      &.delete {
        background: var(--error-light);
        color: var(--error);

        &:hover {
          background: #fecaca;
          transform: scale(1.1);
        }
      }
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
export class LessonFormComponent implements OnInit {
  router = inject(Router);
  lang = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private lessonService = inject(LessonService);
  private contentService = inject(ContentService);
  private dialog = inject(MatDialog);

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

  saveContent(): void {
    this.contentService.createLessonContent({ ...this.contentForm, lesson: this.lessonId }).subscribe({
      next: (c) => {
        this.contents.update(list => [...list, c]);
        this.showContentForm.set(false);
        this.contentForm = { title: '', content_type: '', content: '', video_url: '', file_url: '' };
      }
    });
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
}
