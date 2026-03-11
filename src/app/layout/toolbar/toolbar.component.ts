import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TeacherService } from '../../core/services/teacher.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-toolbar',
  imports: [
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule,
    TranslatePipe, LanguageSwitcherComponent
  ],
  template: `
    <div class="toolbar-wrapper">
      <mat-toolbar class="modern-toolbar">
        <button mat-icon-button (click)="toggleSidenav.emit()" class="menu-btn">
          <mat-icon>menu</mat-icon>
        </button>

        <div class="logo-section">
          <div class="logo-icon">
            <mat-icon>school</mat-icon>
          </div>
          <span class="app-title">{{ 'app.title' | translate }}</span>
        </div>

        <span class="spacer"></span>

        <div class="toolbar-actions">
          <app-language-switcher />

          <button mat-icon-button class="notification-btn">
            <mat-icon>notifications_none</mat-icon>
            <span class="notification-badge"></span>
          </button>

          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <div class="user-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <span class="user-name">{{ teacher?.full_name }}</span>
            <mat-icon class="dropdown-icon">keyboard_arrow_down</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu" class="user-menu">
            <div class="menu-header">
              <div class="menu-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="menu-user-info">
                <span class="menu-user-name">{{ teacher?.full_name }}</span>
                <span class="menu-user-email">{{ teacher?.email }}</span>
              </div>
            </div>
            <div class="menu-divider"></div>
            <button mat-menu-item class="menu-item">
              <mat-icon>settings</mat-icon>
              <span>{{ 'nav.settings' | translate }}</span>
            </button>
            <button mat-menu-item class="menu-item logout-item" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>{{ 'auth.logout' | translate }}</span>
            </button>
          </mat-menu>
        </div>
      </mat-toolbar>
    </div>
  `,
  styles: [`
    .toolbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .modern-toolbar {
      background: var(--white) !important;
      color: var(--gray-800) !important;
      height: 70px;
      padding: 0 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border-bottom: 1px solid var(--gray-100);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .menu-btn {
      color: var(--gray-600);
      transition: all var(--transition);

      &:hover {
        color: var(--primary-600);
        background: var(--primary-50) !important;
      }
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

      mat-icon {
        color: white;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
    }

    .app-title {
      font-size: 1.25rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--gray-900) 0%, var(--gray-700) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .spacer {
      flex: 1;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .notification-btn {
      position: relative;
      color: var(--gray-600);
      transition: all var(--transition);

      &:hover {
        color: var(--primary-600);
        background: var(--primary-50) !important;
      }

      .notification-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 8px;
        height: 8px;
        background: var(--error);
        border-radius: 50%;
        border: 2px solid var(--white);
      }
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 6px;
      border-radius: var(--radius-full);
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      transition: all var(--transition);

      &:hover {
        background: var(--white);
        border-color: var(--primary-300);
        box-shadow: var(--shadow-sm);
      }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .user-name {
      font-weight: 500;
      color: var(--gray-700);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-icon {
      color: var(--gray-400);
      font-size: 18px;
      width: 18px;
      height: 18px;
      transition: transform var(--transition);
    }

    .user-btn[aria-expanded="true"] .dropdown-icon {
      transform: rotate(180deg);
    }

    /* Menu Styles */
    ::ng-deep .user-menu {
      margin-top: 8px;
      min-width: 240px;
      background: var(--white) !important;

      &.mat-mdc-menu-panel {
        background: var(--white) !important;
        border-radius: var(--radius-lg) !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12) !important;
        border: 1px solid var(--gray-100) !important;
        overflow: hidden !important;
      }

      .mat-mdc-menu-surface {
        background: var(--white) !important;
        border-radius: var(--radius-lg) !important;
      }

      .menu-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--gray-50);
      }

      .menu-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%);
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          color: white;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .menu-user-info {
        display: flex;
        flex-direction: column;
      }

      .menu-user-name {
        font-weight: 600;
        color: var(--gray-900);
      }

      .menu-user-email {
        font-size: 0.8rem;
        color: var(--gray-500);
      }

      .menu-divider {
        height: 1px;
        background: var(--gray-200);
        margin: 8px 0;
      }

      .menu-item {
        padding: 12px 16px;

        mat-icon {
          color: var(--gray-500);
          margin-right: 12px;
        }
      }

      .logout-item {
        color: var(--error);

        mat-icon {
          color: var(--error);
        }
      }
    }

    @media (max-width: 768px) {
      .modern-toolbar {
        padding: 0 16px;
        height: 60px;
      }

      .app-title {
        display: none;
      }

      .user-name {
        display: none;
      }
    }
  `]
})
export class ToolbarComponent {
  private teacherService = inject(TeacherService);
  private router = inject(Router);

  toggleSidenav = output<void>();
  teacher = this.teacherService.getCurrentTeacher();

  logout(): void {
    this.teacherService.logout();
    this.router.navigate(['/login']);
  }
}
