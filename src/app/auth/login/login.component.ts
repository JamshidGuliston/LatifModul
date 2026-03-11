import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TeacherService } from '../../core/services/teacher.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    TranslatePipe, LanguageSwitcherComponent
  ],
  template: `
    <div class="login-page">
      <!-- Animated Background -->
      <div class="bg-decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
        <div class="grid-pattern"></div>
      </div>

      <!-- Language Switcher -->
      <div class="lang-switch">
        <app-language-switcher />
      </div>

      <!-- Login Container -->
      <div class="login-container">
        <!-- Left Side - Branding -->
        <div class="branding-section">
          <div class="brand-content">
            <div class="logo-wrapper">
              <div class="logo">
                <mat-icon>school</mat-icon>
              </div>
              <div class="logo-glow"></div>
            </div>
            <h1 class="brand-title">{{ 'app.title' | translate }}</h1>
            <p class="brand-subtitle">{{ 'auth.welcomeMessage' | translate }}</p>

            <div class="features">
              <div class="feature-item">
                <div class="feature-icon">
                  <mat-icon>library_books</mat-icon>
                </div>
                <span>{{ 'auth.feature1' | translate }}</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <mat-icon>people</mat-icon>
                </div>
                <span>{{ 'auth.feature2' | translate }}</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <mat-icon>trending_up</mat-icon>
                </div>
                <span>{{ 'auth.feature3' | translate }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Login Form -->
        <div class="form-section">
          <div class="form-card">
            <div class="form-header">
              <h2>{{ 'auth.login' | translate }}</h2>
              <p>{{ 'auth.loginSubtitle' | translate }}</p>
            </div>

            @if (loading()) {
              <div class="loading-bar">
                <mat-progress-bar mode="indeterminate"></mat-progress-bar>
              </div>
            }

            <form (ngSubmit)="onLogin()" class="login-form">
              <!-- Email Field -->
              <div class="input-group">
                <label for="email">{{ 'auth.email' | translate }}</label>
                <div class="input-wrapper" [class.focused]="emailFocused" [class.error]="error()">
                  <mat-icon class="input-icon">email</mat-icon>
                  <input
                    id="email"
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    [placeholder]="'auth.enterEmail' | translate"
                    (focus)="emailFocused = true"
                    (blur)="emailFocused = false"
                    required
                  >
                </div>
              </div>

              <!-- Password Field -->
              <div class="input-group">
                <label for="password">{{ 'auth.password' | translate }}</label>
                <div class="input-wrapper" [class.focused]="passwordFocused" [class.error]="error()">
                  <mat-icon class="input-icon">lock</mat-icon>
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="password"
                    name="password"
                    [placeholder]="'auth.enterPassword' | translate"
                    (focus)="passwordFocused = true"
                    (blur)="passwordFocused = false"
                    required
                  >
                  <button type="button" class="toggle-password" (click)="showPassword = !showPassword">
                    <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
              </div>

              @if (error()) {
                <div class="error-message">
                  <mat-icon>error_outline</mat-icon>
                  <span>{{ error() | translate }}</span>
                </div>
              }

              <button type="submit" class="login-btn" [disabled]="loading() || !email || !password">
                @if (loading()) {
                  <div class="btn-loader"></div>
                  <span>{{ 'auth.loggingIn' | translate }}</span>
                } @else {
                  <span>{{ 'auth.loginBtn' | translate }}</span>
                  <mat-icon>arrow_forward</mat-icon>
                }
              </button>
            </form>

            <div class="form-footer">
              <p>{{ 'auth.footerText' | translate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--white);
      position: relative;
      overflow: hidden;
    }

    /* Animated Background */
    .bg-decoration {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      animation: float 6s ease-in-out infinite;
    }

    .circle-1 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, var(--primary-100) 0%, transparent 70%);
      top: -200px;
      right: -100px;
      animation-delay: 0s;
    }

    .circle-2 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, var(--info-light) 0%, transparent 70%);
      bottom: -100px;
      left: -100px;
      animation-delay: 2s;
    }

    .circle-3 {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, var(--success-light) 0%, transparent 70%);
      top: 50%;
      left: 30%;
      animation-delay: 4s;
    }

    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(var(--gray-100) 1px, transparent 1px),
        linear-gradient(90deg, var(--gray-100) 1px, transparent 1px);
      background-size: 60px 60px;
      opacity: 0.5;
    }

    /* Language Switcher */
    .lang-switch {
      position: absolute;
      top: 24px;
      right: 24px;
      z-index: 100;
    }

    /* Login Container */
    .login-container {
      display: flex;
      width: 100%;
      max-width: 1000px;
      margin: 24px;
      background: var(--white);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-2xl);
      overflow: hidden;
      position: relative;
      z-index: 10;
      animation: scaleIn 0.6s ease-out;
    }

    /* Branding Section */
    .branding-section {
      flex: 1;
      background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%);
      padding: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
      }
    }

    .brand-content {
      text-align: center;
      position: relative;
      z-index: 1;
      animation: fadeInLeft 0.8s ease-out;
    }

    .logo-wrapper {
      position: relative;
      display: inline-block;
      margin-bottom: 24px;
    }

    .logo {
      width: 80px;
      height: 80px;
      background: var(--white);
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
      animation: bounce 3s ease-in-out infinite;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--primary-600);
      }
    }

    .logo-glow {
      position: absolute;
      inset: -20px;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
      animation: pulse 2s ease-in-out infinite;
    }

    .brand-title {
      color: var(--white);
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 12px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    .brand-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 1rem;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--white);
      font-size: 0.95rem;
      opacity: 0;
      animation: fadeInUp 0.5s ease-out forwards;

      &:nth-child(1) { animation-delay: 0.3s; }
      &:nth-child(2) { animation-delay: 0.5s; }
      &:nth-child(3) { animation-delay: 0.7s; }
    }

    .feature-icon {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Form Section */
    .form-section {
      flex: 1;
      padding: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--white);
    }

    .form-card {
      width: 100%;
      max-width: 360px;
      animation: fadeInRight 0.8s ease-out;
    }

    .form-header {
      text-align: center;
      margin-bottom: 32px;

      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--gray-900);
        margin-bottom: 8px;
      }

      p {
        color: var(--gray-500);
        font-size: 0.95rem;
      }
    }

    .loading-bar {
      margin-bottom: 24px;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
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
      padding: 14px 16px;
      background: var(--gray-50);
      border: 2px solid var(--gray-200);
      border-radius: var(--radius-lg);
      transition: all var(--transition);

      &.focused {
        background: var(--white);
        border-color: var(--primary-500);
        box-shadow: 0 0 0 4px var(--primary-100);
      }

      &.error {
        border-color: var(--error);
        background: var(--error-light);

        .input-icon {
          color: var(--error);
        }
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 1rem;
        color: var(--gray-900);
        outline: none;

        &::placeholder {
          color: var(--gray-400);
        }
      }

      .input-icon {
        color: var(--gray-400);
        font-size: 20px;
        width: 20px;
        height: 20px;
        transition: color var(--transition);
      }

      .toggle-password {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--gray-400);
        transition: color var(--transition);

        &:hover {
          color: var(--gray-600);
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--error);
      font-size: 0.85rem;
      animation: fadeIn 0.3s ease-out;
      padding: 12px 16px;
      background: var(--error-light);
      border-radius: var(--radius);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 16px 24px;
      background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
      color: var(--white);
      border: none;
      border-radius: var(--radius-lg);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      position: relative;
      overflow: hidden;
      margin-top: 8px;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%);
        opacity: 0;
        transition: opacity var(--transition);
      }

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);

        &::before {
          opacity: 1;
        }

        mat-icon {
          transform: translateX(4px);
        }
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      span, mat-icon {
        position: relative;
        z-index: 1;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        transition: transform var(--transition);
      }
    }

    .btn-loader {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: var(--white);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .form-footer {
      margin-top: 32px;
      text-align: center;

      p {
        color: var(--gray-500);
        font-size: 0.85rem;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .login-container {
        flex-direction: column;
        margin: 16px;
      }

      .branding-section {
        padding: 32px;
      }

      .brand-title {
        font-size: 1.5rem;
      }

      .features {
        display: none;
      }

      .form-section {
        padding: 32px;
      }
    }
  `]
})
export class LoginComponent {
  private teacherService = inject(TeacherService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  emailFocused = false;
  passwordFocused = false;
  showPassword = false;

  onLogin(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.teacherService.login(this.email, this.password).subscribe({
      next: (teacher) => {
        if (teacher.id !== environment.teacherId) {
          this.error.set('auth.invalidCredentials');
          this.loading.set(false);
          return;
        }
        this.teacherService.setCurrentTeacher(teacher);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error.set('auth.invalidCredentials');
        this.loading.set(false);
      }
    });
  }
}
