import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ModuleService } from '../../core/services/module.service';
import { StudentService } from '../../core/services/student.service';
import { Module } from '../../core/models/module.model';
import { Student } from '../../core/models/student.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-student-modules',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="student-page">

      <!-- Navbar -->
      <nav class="s-navbar">
        <div class="s-nav-inner">
          <div class="s-brand" (click)="router.navigate(['/'])">
            <div class="s-logo">
              <mat-icon>school</mat-icon>
            </div>
            <span class="s-brand-name">Latif Modul</span>
          </div>
          <div class="s-nav-actions">
            <div class="s-student-chip">
              <div class="s-avatar">{{ avatarLetter }}</div>
              <span>{{ currentStudent()?.full_name }}</span>
            </div>
            <button class="s-logout-btn" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <div class="s-hero">
        <div class="s-hero-bg">
          <div class="s-blob blob-1"></div>
          <div class="s-blob blob-2"></div>
        </div>
        <div class="s-hero-content">
          <div class="s-welcome-tag">
            <mat-icon>waving_hand</mat-icon>
            <span>Xush kelibsiz!</span>
          </div>
          <h1>Salom, <span class="s-name-highlight">{{ firstName }}</span>!</h1>
          <p>O'rganishni davom ettiring. Bilim — kelajagingizga qilingan eng yaxshi sarmoya.</p>
          <div class="s-hero-stats">
            <div class="s-hs-item">
              <div class="s-hs-num">{{ modules().length }}</div>
              <div class="s-hs-lbl">Modullar</div>
            </div>
            <div class="s-hs-divider"></div>
            <div class="s-hs-item">
              <div class="s-hs-num">{{ totalLessons }}</div>
              <div class="s-hs-lbl">Darslar</div>
            </div>
            <div class="s-hs-divider"></div>
            <div class="s-hs-item">
              <div class="s-hs-num">∞</div>
              <div class="s-hs-lbl">Imkoniyat</div>
            </div>
          </div>
        </div>
        <div class="s-hero-art">
          <div class="s-art-circle c1">
            <mat-icon>auto_stories</mat-icon>
          </div>
          <div class="s-art-circle c2">
            <mat-icon>emoji_events</mat-icon>
          </div>
          <div class="s-art-circle c3">
            <mat-icon>lightbulb</mat-icon>
          </div>
          <div class="s-art-main">
            <mat-icon>school</mat-icon>
          </div>
        </div>
      </div>

      <!-- Main -->
      <main class="s-main">

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="s-section-title">
            <div class="sk sk-title"></div>
          </div>
          <div class="s-modules-grid">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="s-card-skeleton">
                <div class="sk sk-thumb"></div>
                <div class="sk-body">
                  <div class="sk sk-h"></div>
                  <div class="sk sk-p"></div>
                  <div class="sk sk-foot"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Empty State -->
        @else if (modules().length === 0) {
          <div class="s-empty">
            <div class="s-empty-icon">
              <mat-icon>library_books</mat-icon>
            </div>
            <h2>Hozircha modullar yo'q</h2>
            <p>O'qituvchi modullarni qo'shgach, ular bu yerda ko'rinadi.</p>
          </div>
        }

        <!-- Modules -->
        @else {
          <div class="s-section-header">
            <div class="s-section-title-wrap">
              <div class="s-section-icon">
                <mat-icon>library_books</mat-icon>
              </div>
              <h2>Barcha modullar</h2>
            </div>
            <div class="s-count-badge">{{ modules().length }} ta modul</div>
          </div>

          <div class="s-modules-grid">
            @for (mod of modules(); track mod.id; let i = $index) {
              <div class="s-module-card" (click)="openModule(mod.id)"
                   [style.animation-delay]="(i * 0.06) + 's'">

                <!-- Thumbnail -->
                <div class="s-card-thumb"
                     [class.has-img]="mod.thumbnail"
                     [style.background-image]="mod.thumbnail ? 'url(' + mod.thumbnail + ')' : ''">
                  @if (!mod.thumbnail) {
                    <div class="s-thumb-placeholder" [class]="getCardColor(i)">
                      <mat-icon>{{ getCardIcon(i) }}</mat-icon>
                    </div>
                  }
                  <div class="s-thumb-overlay"></div>
                  <div class="s-card-num">{{ i + 1 }}</div>
                </div>

                <!-- Body -->
                <div class="s-card-body">
                  <h3 class="s-card-title">{{ mod.title }}</h3>
                  <p class="s-card-desc">{{ mod.description || 'Bu modul haqida tavsif yo\'q.' }}</p>

                  <div class="s-card-footer">
                    <div class="s-card-meta">
                      <div class="s-meta-item">
                        <mat-icon>menu_book</mat-icon>
                        <span>{{ mod.lessons_count || 0 }} dars</span>
                      </div>
                    </div>
                    <div class="s-open-btn">
                      <mat-icon>arrow_forward</mat-icon>
                    </div>
                  </div>
                </div>

              </div>
            }
          </div>
        }

      </main>

      <!-- Footer -->
      <footer class="s-footer">
        <p>© 2025 Latif Modul — Bilim platformasi</p>
      </footer>

    </div>
  `,
  styles: [`
    /* ===== PAGE ===== */
    .student-page {
      min-height: 100vh;
      background: #f8faff;
      display: flex;
      flex-direction: column;
    }

    /* ===== NAVBAR ===== */
    .s-navbar {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    .s-nav-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .s-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-decoration: none;
    }

    .s-logo {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59,130,246,0.3);

      mat-icon { color: white; font-size: 22px; width: 22px; height: 22px; }
    }

    .s-brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.3px;
    }

    .s-nav-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .s-student-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f3f4f6;
      border-radius: 100px;
      padding: 6px 14px 6px 6px;
      border: 1px solid #e5e7eb;

      span {
        font-size: 0.88rem;
        font-weight: 600;
        color: #374151;
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .s-avatar {
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, #3b82f6, #7c3aed);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .s-logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #fff1f2;
      color: #e11d48;
      border: 1px solid #fecdd3;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: #ffe4e6; border-color: #fda4af; }
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    /* ===== HERO ===== */
    .s-hero {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #06b6d4 100%);
      padding: 60px 24px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 100%;
    }

    .s-hero-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .s-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.3;
    }

    .blob-1 {
      width: 400px;
      height: 400px;
      background: #60a5fa;
      top: -150px;
      left: -100px;
    }

    .blob-2 {
      width: 300px;
      height: 300px;
      background: #0891b2;
      bottom: -100px;
      right: 100px;
    }

    .s-hero-content {
      position: relative;
      z-index: 2;
      max-width: 600px;
      margin: 0 auto 0 calc((100% - 1280px) / 2 + 24px);
      padding-left: 0;
    }

    .s-welcome-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 100px;
      padding: 6px 16px;
      color: white;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 16px;
      backdrop-filter: blur(8px);

      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .s-hero-content h1 {
      font-size: 2.75rem;
      font-weight: 900;
      color: white;
      margin-bottom: 14px;
      line-height: 1.15;
    }

    .s-name-highlight {
      background: linear-gradient(90deg, #fbbf24, #f472b6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .s-hero-content p {
      color: rgba(255,255,255,0.82);
      font-size: 1.05rem;
      line-height: 1.65;
      margin-bottom: 32px;
      max-width: 480px;
    }

    .s-hero-stats {
      display: flex;
      align-items: center;
      gap: 24px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 16px 24px;
      backdrop-filter: blur(10px);
      width: fit-content;
    }

    .s-hs-item {
      text-align: center;

      .s-hs-num {
        font-size: 1.75rem;
        font-weight: 800;
        color: white;
        line-height: 1;
        margin-bottom: 4px;
      }

      .s-hs-lbl {
        font-size: 0.78rem;
        color: rgba(255,255,255,0.7);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .s-hs-divider {
      width: 1px;
      height: 36px;
      background: rgba(255,255,255,0.25);
    }

    /* Hero Art */
    .s-hero-art {
      position: absolute;
      right: calc((100% - 1280px) / 2 + 48px);
      top: 50%;
      transform: translateY(-50%);
      width: 200px;
      height: 200px;
      z-index: 2;

      @media (max-width: 900px) { display: none; }
    }

    .s-art-main {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 72px;
      height: 72px;
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.35);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);

      mat-icon { color: white; font-size: 36px; width: 36px; height: 36px; }
    }

    .s-art-circle {
      position: absolute;
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(6px);
      animation: float 3s ease-in-out infinite;

      mat-icon { color: white; font-size: 20px; width: 20px; height: 20px; }

      &.c1 { top: 0; left: 30px; animation-delay: 0s; }
      &.c2 { bottom: 10px; right: 0; animation-delay: 1s; }
      &.c3 { top: 20px; right: 10px; animation-delay: 2s; }
    }

    /* ===== MAIN CONTENT ===== */
    .s-main {
      max-width: 1280px;
      margin: 0 auto;
      padding: 48px 24px;
      flex: 1;
      width: 100%;
    }

    /* Skeleton */
    .sk {
      background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }
    .sk-title { width: 200px; height: 28px; margin-bottom: 28px; }
    .sk-thumb { height: 200px; border-radius: 0; }
    .sk-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .sk-h { height: 20px; width: 80%; }
    .sk-p { height: 14px; width: 60%; }
    .sk-foot { height: 14px; width: 40%; margin-top: 8px; }

    .s-card-skeleton {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }

    /* Section Header */
    .s-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .s-section-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        font-size: 1.35rem;
        font-weight: 800;
        color: #111827;
        margin: 0;
      }
    }

    .s-section-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #dbeafe, #eff6ff);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #bfdbfe;

      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #2563eb; }
    }

    .s-count-badge {
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 100px;
      border: 1px solid #bfdbfe;
    }

    /* Modules Grid */
    .s-modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }

    /* Module Card */
    .s-module-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      animation: fadeInUp 0.5s ease-out forwards;

      &:hover {
        transform: translateY(-6px);
        box-shadow: 0 20px 48px rgba(0,0,0,0.12);
        border-color: #bfdbfe;

        .s-open-btn {
          background: #2563eb;
          color: white;
          transform: translateX(3px);
        }

        .s-card-thumb .s-thumb-overlay {
          opacity: 1;
        }
      }
    }

    /* Card Thumbnail */
    .s-card-thumb {
      height: 190px;
      background-size: cover;
      background-position: center;
      position: relative;
      overflow: hidden;

      &.has-img .s-thumb-overlay { background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%); }
    }

    .s-thumb-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon { font-size: 52px; width: 52px; height: 52px; color: white; opacity: 0.9; }

      &.color-0 { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
      &.color-1 { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
      &.color-2 { background: linear-gradient(135deg, #10b981, #047857); }
      &.color-3 { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &.color-4 { background: linear-gradient(135deg, #ef4444, #b91c1c); }
      &.color-5 { background: linear-gradient(135deg, #06b6d4, #0e7490); }
    }

    .s-thumb-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.25s;
    }

    .s-card-num {
      position: absolute;
      top: 14px;
      left: 14px;
      width: 32px;
      height: 32px;
      background: rgba(255,255,255,0.95);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 800;
      color: #1d4ed8;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* Card Body */
    .s-card-body {
      padding: 20px;
    }

    .s-card-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .s-card-desc {
      font-size: 0.85rem;
      color: #6b7280;
      line-height: 1.55;
      margin: 0 0 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .s-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 14px;
      border-top: 1px solid #f3f4f6;
    }

    .s-card-meta {
      display: flex;
      gap: 12px;
    }

    .s-meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.82rem;
      color: #6b7280;
      font-weight: 500;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #9ca3af; }
    }

    .s-open-btn {
      width: 34px;
      height: 34px;
      background: #eff6ff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
      transition: all 0.2s;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    /* Empty State */
    .s-empty {
      text-align: center;
      padding: 100px 20px;
    }

    .s-empty-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #dbeafe, #eff6ff);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      border: 2px solid #bfdbfe;

      mat-icon { font-size: 36px; width: 36px; height: 36px; color: #2563eb; }
    }

    .s-empty h2 {
      font-size: 1.4rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 10px;
    }

    .s-empty p {
      color: #6b7280;
      font-size: 0.95rem;
    }

    /* Footer */
    .s-footer {
      text-align: center;
      padding: 24px;
      color: #9ca3af;
      font-size: 0.82rem;
      border-top: 1px solid #e5e7eb;
      background: white;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .s-hero { padding: 40px 16px; }
      .s-hero-content { margin: 0; }
      .s-hero-content h1 { font-size: 2rem; }
      .s-main { padding: 32px 16px; }
      .s-modules-grid { grid-template-columns: 1fr; }
      .s-student-chip span { display: none; }
    }
  `]
})
export class StudentModulesComponent implements OnInit {
  router = inject(Router);
  private moduleService = inject(ModuleService);
  private studentService = inject(StudentService);

  modules = signal<Module[]>([]);
  currentStudent = signal<Student | null>(null);
  isLoading = signal(true);

  get avatarLetter(): string {
    const name = this.currentStudent()?.full_name;
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  get firstName(): string {
    const name = this.currentStudent()?.full_name;
    if (!name) return 'Talaba';
    return name.split(' ')[0];
  }

  get totalLessons(): number {
    return this.modules().reduce((sum, m) => sum + (m.lessons_count || 0), 0);
  }

  getCardColor(index: number): string {
    return `color-${index % 6}`;
  }

  getCardIcon(index: number): string {
    const icons = ['auto_stories', 'science', 'calculate', 'language', 'history_edu', 'biotech'];
    return icons[index % icons.length];
  }

  ngOnInit() {
    this.currentStudent.set(this.studentService.getCurrentStudent());

    this.moduleService.getAll(environment.teacherId).subscribe({
      next: (mods) => {
        this.modules.set(mods);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openModule(moduleId: string) {
    this.router.navigate(['/student/modules', moduleId]);
  }

  logout() {
    this.studentService.studentLogout();
    this.router.navigate(['/']);
  }
}
