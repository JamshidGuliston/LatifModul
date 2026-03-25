import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TeacherService } from '../../core/services/teacher.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, TranslatePipe],
  template: `
    <div class="sidebar">

      <!-- Teacher Profile Card -->
      <div class="teacher-card">
        <div class="tc-avatar">
          <span>{{ avatarLetter }}</span>
          <div class="tc-status"></div>
        </div>
        <div class="tc-info">
          <span class="tc-name">{{ teacher?.full_name || "O'qituvchi" }}</span>
          <span class="tc-role">
            <mat-icon>verified</mat-icon>
            O'qituvchi
          </span>
        </div>
      </div>

      <!-- Nav Section: Asosiy -->
      <div class="nav-section">
        <span class="nav-section-label">Boshqaruv</span>
        <nav class="nav-list">
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
            <div class="ni-icon">
              <mat-icon>dashboard</mat-icon>
            </div>
            <span class="ni-text">{{ 'nav.dashboard' | translate }}</span>
            <div class="ni-dot"></div>
          </a>

          <a class="nav-item" routerLink="/students" routerLinkActive="active">
            <div class="ni-icon">
              <mat-icon>people</mat-icon>
            </div>
            <span class="ni-text">{{ 'nav.students' | translate }}</span>
            <div class="ni-dot"></div>
          </a>

          <a class="nav-item" routerLink="/modules" routerLinkActive="active">
            <div class="ni-icon">
              <mat-icon>library_books</mat-icon>
            </div>
            <span class="ni-text">{{ 'nav.modules' | translate }}</span>
            <div class="ni-dot"></div>
          </a>

          <a class="nav-item" routerLink="/lessons" routerLinkActive="active">
            <div class="ni-icon">
              <mat-icon>video_library</mat-icon>
            </div>
            <span class="ni-text">{{ 'nav.lessons' | translate }}</span>
            <div class="ni-dot"></div>
          </a>

          <a class="nav-item" routerLink="/assignments" routerLinkActive="active">
            <div class="ni-icon">
              <mat-icon>assignment</mat-icon>
            </div>
            <span class="ni-text">{{ 'nav.assignments' | translate }}</span>
            <div class="ni-dot"></div>
          </a>
        </nav>
      </div>

      <!-- Nav Section: Analitika -->
      <div class="nav-section">
        <span class="nav-section-label">Tahliyot</span>
        <nav class="nav-list">
          <a class="nav-item" routerLink="/progress" routerLinkActive="active">
            <div class="ni-icon">
              <mat-icon>bar_chart</mat-icon>
            </div>
            <span class="ni-text">{{ 'nav.progress' | translate }}</span>
            <div class="ni-dot"></div>
          </a>
        </nav>
      </div>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="tip-card">
          <div class="tip-icon">
            <mat-icon>tips_and_updates</mat-icon>
          </div>
          <div class="tip-body">
            <span class="tip-title">Maslahat</span>
            <span class="tip-text">Modullarni muntazam yangilash talabalar faolligini oshiradi.</span>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 20px 12px;
      gap: 8px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Teacher Card */
    .teacher-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 12px;
      background: linear-gradient(135deg, #eff6ff, #f0fdf4);
      border-radius: 14px;
      border: 1px solid #dbeafe;
      margin-bottom: 8px;
    }

    .tc-avatar {
      position: relative;
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #3b82f6, #7c3aed);
      border-radius: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(59,130,246,0.3);

      span {
        font-size: 1.15rem;
        font-weight: 800;
        color: white;
      }
    }

    .tc-status {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #10b981;
      border-radius: 50%;
      border: 2px solid white;
    }

    .tc-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .tc-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tc-role {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #2563eb;
      font-weight: 600;

      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    /* Nav Section */
    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-section-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 0 12px;
      margin-bottom: 4px;
    }

    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    /* Nav Item */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 12px;
      border-radius: 12px;
      text-decoration: none;
      color: #6b7280;
      font-size: 0.9rem;
      font-weight: 500;
      position: relative;
      transition: all 0.18s ease;
      overflow: hidden;

      &:hover {
        color: #2563eb;
        background: #eff6ff;

        .ni-icon {
          background: #dbeafe;
          color: #2563eb;
        }
      }

      &.active {
        color: #1d4ed8;
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        font-weight: 700;

        .ni-icon {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);

          mat-icon { color: white; }
        }

        .ni-dot {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
      }
    }

    .ni-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.18s;
      flex-shrink: 0;

      mat-icon {
        font-size: 19px;
        width: 19px;
        height: 19px;
        color: #6b7280;
        transition: color 0.18s;
      }
    }

    .ni-text {
      flex: 1;
    }

    .ni-dot {
      width: 6px;
      height: 6px;
      background: #3b82f6;
      border-radius: 50%;
      opacity: 0;
      transform: translateY(-50%) scale(0);
      transition: all 0.18s;
    }

    /* Footer */
    .sidebar-footer {
      margin-top: auto;
      padding-top: 12px;
    }

    .tip-card {
      display: flex;
      gap: 10px;
      padding: 14px;
      background: linear-gradient(135deg, #fef3c7, #fef9e7);
      border: 1px solid #fde68a;
      border-radius: 14px;
    }

    .tip-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #fbbf24, #d97706);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 3px 10px rgba(217,119,6,0.25);

      mat-icon { color: white; font-size: 18px; width: 18px; height: 18px; }
    }

    .tip-body {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .tip-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: #92400e;
    }

    .tip-text {
      font-size: 0.72rem;
      color: #b45309;
      line-height: 1.45;
    }
  `]
})
export class SidebarComponent implements OnInit {
  private teacherService = inject(TeacherService);

  teacher = this.teacherService.getCurrentTeacher();

  get avatarLetter(): string {
    const name = this.teacher?.full_name;
    return name ? name.charAt(0).toUpperCase() : 'T';
  }

  ngOnInit() { }
}
