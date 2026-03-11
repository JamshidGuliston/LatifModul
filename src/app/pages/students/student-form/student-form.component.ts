import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { StudentService } from '../../../core/services/student.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-student-form',
  imports: [
    FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatSlideToggleModule, MatIconModule,
    TranslatePipe, LoadingSpinnerComponent
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <button class="back-btn" (click)="router.navigate(['/students'])" type="button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>{{ isEdit() ? 'person' : 'person_add' }}</mat-icon>
          </div>
          <div class="header-text">
            <h1>{{ (isEdit() ? 'students.edit' : 'students.add') | translate }}</h1>
            <p>{{ isEdit() ? 'Talaba ma\\'lumotlarini yangilash' : 'Yangi talaba qo\\'shish' }}</p>
          </div>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="form-container">
          <form (ngSubmit)="onSave()" #studentForm="ngForm" class="modern-form">
            <div class="form-section">
              <h3 class="section-title">{{ 'common.basicInfo' | translate }}</h3>
              
              <div class="form-grid">
                <div class="input-group">
                  <label for="full_name">{{ 'students.name' | translate }} *</label>
                  <div class="input-wrapper" [class.error]="name.invalid && name.touched">
                    <mat-icon>badge</mat-icon>
                    <input id="full_name" [(ngModel)]="form.full_name" name="full_name" 
                           placeholder="Talaba ismini kiriting" required #name="ngModel">
                  </div>
                  @if (name.invalid && name.touched) {
                    <span class="error-text">Ism kiritilishi shart</span>
                  }
                </div>

                <div class="input-group">
                  <label for="email">{{ 'students.email' | translate }} *</label>
                  <div class="input-wrapper" [class.error]="email.invalid && email.touched">
                    <mat-icon>email</mat-icon>
                    <input id="email" type="email" [(ngModel)]="form.email" name="email" 
                           placeholder="example@mail.com" required email #email="ngModel">
                  </div>
                  @if (email.invalid && email.touched) {
                    <span class="error-text">To\\'g\\'ri email kiriting</span>
                  }
                </div>
              </div>

              @if (!isEdit()) {
                <div class="input-group">
                  <label for="password">{{ 'students.password' | translate }} *</label>
                  <div class="input-wrapper" [class.error]="pass.invalid && pass.touched">
                    <mat-icon>lock</mat-icon>
                    <input id="password" type="password" [(ngModel)]="form.password" name="password" 
                           placeholder="Kamida 6 ta belgi" required minlength="6" #pass="ngModel">
                  </div>
                  @if (pass.invalid && pass.touched) {
                    <span class="error-text">Parol kamida 6 belgidan iborat bo\\'lishi kerak</span>
                  }
                </div>
              }
            </div>

            <div class="form-section">
              <h3 class="section-title">Sozlamalar</h3>
              
              <div class="toggle-group">
                <div class="toggle-item">
                  <div class="toggle-info">
                    <mat-icon [class.active]="form.is_active">verified_user</mat-icon>
                    <div>
                      <span class="toggle-label">{{ 'common.status' | translate }}</span>
                      <span class="toggle-desc">{{ form.is_active ? 'Talaba tizimdan foydalana oladi' : 'Talaba tizimga kira olmaydi' }}</span>
                    </div>
                  </div>
                  <mat-slide-toggle color="primary" [(ngModel)]="form.is_active" name="is_active">
                  </mat-slide-toggle>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-secondary" type="button" (click)="router.navigate(['/students'])">
                <mat-icon>close</mat-icon>
                {{ 'common.cancel' | translate }}
              </button>
              <button class="btn btn-primary" type="submit" [disabled]="saving() || studentForm.invalid">
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
      }
    </div>
  `,
  styles: [`
    .page-container {
      animation: fadeIn 0.5s ease-out;
      max-width: 900px;
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
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);

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
      padding: 32px;
      animation: fadeInUp 0.5s ease-out;
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

      @media (max-width: 600px) {
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

      input {
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
          color: var(--success);
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

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class StudentFormComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  studentId = '';

  form: any = {
    full_name: '',
    email: '',
    password: '',
    is_active: true
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.studentId = id;
      this.loading.set(true);
      this.studentService.getById(id).subscribe({
        next: (student) => {
          this.form = { ...student };
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  onSave(): void {
    this.saving.set(true);
    const teacher = this.teacherService.getCurrentTeacher();

    if (this.isEdit()) {
      const { password, ...data } = this.form;
      this.studentService.update(this.studentId, data).subscribe({
        next: () => this.router.navigate(['/students']),
        error: () => this.saving.set(false)
      });
    } else {
      this.studentService.create({ ...this.form, teacher: teacher?.id }).subscribe({
        next: () => this.router.navigate(['/students']),
        error: () => this.saving.set(false)
      });
    }
  }
}


