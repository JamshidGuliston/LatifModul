import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-student-auth',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTabsModule, FormsModule, TranslatePipe],
  template: `
    <div class="auth-dialog">
      <div class="auth-header">
        <div class="auth-icon">
          <mat-icon>school</mat-icon>
        </div>
        <h2>{{ 'studentAuth.title' | translate }}</h2>
        <p>{{ 'studentAuth.subtitle' | translate }}</p>
      </div>

      <mat-tab-group [(selectedIndex)]="activeTab" class="auth-tabs">
        <!-- Kirish Tab -->
        <mat-tab [label]="'studentAuth.loginTab' | translate">
          <div class="tab-content">
            <div class="form-group">
              <label>{{ 'auth.email' | translate }}</label>
              <div class="input-wrapper">
                <mat-icon>email</mat-icon>
                <input type="email"
                       [(ngModel)]="loginEmail"
                       [placeholder]="'auth.enterEmail' | translate">
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'auth.password' | translate }}</label>
              <div class="input-wrapper">
                <mat-icon>lock</mat-icon>
                <input type="password"
                       [(ngModel)]="loginPassword"
                       [placeholder]="'auth.enterPassword' | translate">
              </div>
            </div>

            @if (errorMessage()) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                {{ errorMessage() }}
              </div>
            }

            <button mat-flat-button color="primary" class="submit-btn"
                    (click)="onLogin()"
                    [disabled]="isLoading()">
              @if (isLoading()) {
                {{ 'auth.loggingIn' | translate }}
              } @else {
                {{ 'auth.loginBtn' | translate }}
              }
            </button>
          </div>
        </mat-tab>

        <!-- Ro'yxatdan o'tish Tab -->
        <mat-tab [label]="'studentAuth.registerTab' | translate">
          <div class="tab-content">
            <div class="form-group">
              <label>{{ 'students.name' | translate }}</label>
              <div class="input-wrapper">
                <mat-icon>person</mat-icon>
                <input type="text"
                       [(ngModel)]="registerName"
                       [placeholder]="'studentAuth.enterName' | translate">
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'auth.email' | translate }}</label>
              <div class="input-wrapper">
                <mat-icon>email</mat-icon>
                <input type="email"
                       [(ngModel)]="registerEmail"
                       [placeholder]="'auth.enterEmail' | translate">
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'auth.password' | translate }}</label>
              <div class="input-wrapper">
                <mat-icon>lock</mat-icon>
                <input type="password"
                       [(ngModel)]="registerPassword"
                       [placeholder]="'auth.enterPassword' | translate">
              </div>
            </div>

            @if (errorMessage()) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                {{ errorMessage() }}
              </div>
            }

            <button mat-flat-button color="primary" class="submit-btn"
                    (click)="onRegister()"
                    [disabled]="isLoading()">
              @if (isLoading()) {
                {{ 'common.loading' | translate }}
              } @else {
                {{ 'studentAuth.registerBtn' | translate }}
              }
            </button>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .auth-dialog {
      padding: 32px;
      min-width: 400px;
      max-width: 480px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 24px;

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--gray-900);
        margin: 12px 0 4px;
      }

      p {
        color: var(--gray-500);
        font-size: 0.9rem;
        margin: 0;
      }
    }

    .auth-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;

      mat-icon {
        color: white;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .tab-content {
      padding: 24px 0 0;
    }

    .form-group {
      margin-bottom: 16px;

      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--gray-700);
        margin-bottom: 6px;
      }
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      border: 1px solid var(--gray-300);
      border-radius: 12px;
      padding: 0 12px;
      transition: border-color 0.2s;
      background: var(--gray-50);

      &:focus-within {
        border-color: var(--primary-500);
        background: white;
      }

      mat-icon {
        color: var(--gray-400);
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-right: 8px;
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        padding: 12px 0;
        font-size: 0.95rem;
        background: transparent;
        color: var(--gray-900);

        &::placeholder {
          color: var(--gray-400);
        }
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(239, 68, 68, 0.1);
      color: var(--error);
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 0.85rem;
      margin-bottom: 16px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .submit-btn {
      width: 100%;
      padding: 12px !important;
      border-radius: 12px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
    }

    ::ng-deep .auth-tabs .mat-mdc-tab-header {
      border-bottom: 1px solid var(--gray-200);
    }
  `]
})
export class StudentAuthComponent {
  private studentService = inject(StudentService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<StudentAuthComponent>);

  activeTab = 0;

  loginEmail = '';
  loginPassword = '';
  registerName = '';
  registerEmail = '';
  registerPassword = '';

  isLoading = signal(false);
  errorMessage = signal('');

  onLogin() {
    if (!this.loginEmail || !this.loginPassword) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.studentService.login(this.loginEmail, this.loginPassword).subscribe({
      next: (student) => {
        this.studentService.setCurrentStudent(student);
        this.dialogRef.close(true);
        this.router.navigate(['/student/modules']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.detail || err.error?.message || 'Email yoki parol noto\'g\'ri');
      }
    });
  }

  onRegister() {
    if (!this.registerName || !this.registerEmail || !this.registerPassword) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.studentService.create({
      teacher: environment.teacherId,
      full_name: this.registerName,
      email: this.registerEmail,
      password: this.registerPassword
    }).subscribe({
      next: (student) => {
        this.studentService.setCurrentStudent(student);
        this.dialogRef.close(true);
        this.router.navigate(['/student/modules']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.email?.[0] || err.error?.detail || err.error?.message || 'Xatolik yuz berdi';
        this.errorMessage.set(msg);
      }
    });
  }
}
