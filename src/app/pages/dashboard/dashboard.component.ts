import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TeacherService } from '../../core/services/teacher.service';
import { ModuleService } from '../../core/services/module.service';
import { StudentService } from '../../core/services/student.service';
import { LessonService } from '../../core/services/lesson.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatButtonModule, RouterLink, TranslatePipe],
  template: `
    <div class="dashboard">

      <!-- Welcome Hero -->
      <div class="hero-banner">
        <div class="hero-left">
          <div class="greeting-badge">
            <span class="greeting-icon">{{ greetingIcon }}</span>
            <span>{{ greeting }}</span>
          </div>
          <h1 class="hero-title">{{ teacher?.full_name || "O'qituvchi" }} 👋</h1>
          <p class="hero-sub">Bugun ham muvaffaqiyatli kun bo'lsin! Platformadagi barcha ma'lumotlar quyida.</p>
          <div class="hero-btns">
            <a routerLink="/modules" mat-flat-button class="btn-primary-hero">
              <mat-icon>add</mat-icon> Yangi modul
            </a>
            <a routerLink="/students" mat-stroked-button class="btn-outline-hero">
              <mat-icon>person_add</mat-icon> Talaba qo'shish
            </a>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-illustration">
            <div class="illustration-ring ring-1"></div>
            <div class="illustration-ring ring-2"></div>
            <div class="illustration-ring ring-3"></div>
            <div class="illustration-icon">
              <mat-icon>school</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      @if (loading()) {
        <div class="stats-grid">
          @for (i of [1,2,3,4]; track i) {
            <div class="stat-skeleton">
              <div class="sk sk-icon"></div>
              <div class="sk sk-num"></div>
              <div class="sk sk-label"></div>
            </div>
          }
        </div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card blue" [class.animate]="!loading()">
            <div class="stat-bg-shape"></div>
            <div class="stat-top">
              <div class="stat-icon-wrap">
                <mat-icon>library_books</mat-icon>
              </div>
              <div class="stat-badge up">
                <mat-icon>arrow_upward</mat-icon>+12%
              </div>
            </div>
            <div class="stat-num">{{ totalModules() }}</div>
            <div class="stat-lbl">{{ 'dashboard.totalModules' | translate }}</div>
            <div class="stat-bar"><div class="stat-fill" [style.width]="'75%'"></div></div>
          </div>

          <div class="stat-card purple" [class.animate]="!loading()">
            <div class="stat-bg-shape"></div>
            <div class="stat-top">
              <div class="stat-icon-wrap">
                <mat-icon>people</mat-icon>
              </div>
              <div class="stat-badge up">
                <mat-icon>arrow_upward</mat-icon>+8%
              </div>
            </div>
            <div class="stat-num">{{ totalStudents() }}</div>
            <div class="stat-lbl">{{ 'dashboard.totalStudents' | translate }}</div>
            <div class="stat-bar"><div class="stat-fill" [style.width]="'60%'"></div></div>
          </div>

          <div class="stat-card green" [class.animate]="!loading()">
            <div class="stat-bg-shape"></div>
            <div class="stat-top">
              <div class="stat-icon-wrap">
                <mat-icon>verified</mat-icon>
              </div>
              <div class="stat-badge up">
                <mat-icon>arrow_upward</mat-icon>+5%
              </div>
            </div>
            <div class="stat-num">{{ activeModules() }}</div>
            <div class="stat-lbl">{{ 'dashboard.activeModules' | translate }}</div>
            <div class="stat-bar"><div class="stat-fill" [style.width]="activePercent + '%'"></div></div>
          </div>

          <div class="stat-card orange" [class.animate]="!loading()">
            <div class="stat-bg-shape"></div>
            <div class="stat-top">
              <div class="stat-icon-wrap">
                <mat-icon>menu_book</mat-icon>
              </div>
              <div class="stat-badge up">
                <mat-icon>arrow_upward</mat-icon>+15%
              </div>
            </div>
            <div class="stat-num">{{ totalLessons() }}</div>
            <div class="stat-lbl">{{ 'dashboard.totalLessons' | translate }}</div>
            <div class="stat-bar"><div class="stat-fill" [style.width]="'85%'"></div></div>
          </div>
        </div>

        <!-- Bottom Section -->
        <div class="bottom-grid">

          <!-- Quick Actions -->
          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <div class="panel-icon-wrap">
                  <mat-icon>flash_on</mat-icon>
                </div>
                <h3>Tezkor harakatlar</h3>
              </div>
            </div>
            <div class="quick-actions">
              <a routerLink="/modules" class="qa-card">
                <div class="qa-icon blue">
                  <mat-icon>add_box</mat-icon>
                </div>
                <div class="qa-info">
                  <span class="qa-title">Modul yaratish</span>
                  <span class="qa-desc">Yangi kurs moduli qo'shish</span>
                </div>
                <mat-icon class="qa-arrow">arrow_forward_ios</mat-icon>
              </a>
              <a routerLink="/students" class="qa-card">
                <div class="qa-icon purple">
                  <mat-icon>person_add</mat-icon>
                </div>
                <div class="qa-info">
                  <span class="qa-title">Talaba qo'shish</span>
                  <span class="qa-desc">Yangi talabani ro'yxatga olish</span>
                </div>
                <mat-icon class="qa-arrow">arrow_forward_ios</mat-icon>
              </a>
              <a routerLink="/lessons" class="qa-card">
                <div class="qa-icon green">
                  <mat-icon>video_library</mat-icon>
                </div>
                <div class="qa-info">
                  <span class="qa-title">Dars qo'shish</span>
                  <span class="qa-desc">Modulga yangi dars biriktirish</span>
                </div>
                <mat-icon class="qa-arrow">arrow_forward_ios</mat-icon>
              </a>
              <a routerLink="/progress" class="qa-card">
                <div class="qa-icon orange">
                  <mat-icon>bar_chart</mat-icon>
                </div>
                <div class="qa-info">
                  <span class="qa-title">Hisobot ko'rish</span>
                  <span class="qa-desc">Talabalar taraqqiyotini kuzatish</span>
                </div>
                <mat-icon class="qa-arrow">arrow_forward_ios</mat-icon>
              </a>
            </div>
          </div>

          <!-- Overview Panel -->
          <div class="panel">
            <div class="panel-head">
              <div class="panel-title">
                <div class="panel-icon-wrap">
                  <mat-icon>insights</mat-icon>
                </div>
                <h3>Umumiy holat</h3>
              </div>
            </div>

            <div class="overview-list">
              <div class="ov-item">
                <div class="ov-left">
                  <div class="ov-dot blue"></div>
                  <span>Jami modullar</span>
                </div>
                <div class="ov-right">
                  <span class="ov-val">{{ totalModules() }}</span>
                  <div class="ov-bar-wrap">
                    <div class="ov-bar blue" [style.width]="'100%'"></div>
                  </div>
                </div>
              </div>
              <div class="ov-item">
                <div class="ov-left">
                  <div class="ov-dot green"></div>
                  <span>Faol modullar</span>
                </div>
                <div class="ov-right">
                  <span class="ov-val">{{ activeModules() }}</span>
                  <div class="ov-bar-wrap">
                    <div class="ov-bar green" [style.width]="activePercent + '%'"></div>
                  </div>
                </div>
              </div>
              <div class="ov-item">
                <div class="ov-left">
                  <div class="ov-dot purple"></div>
                  <span>Jami talabalar</span>
                </div>
                <div class="ov-right">
                  <span class="ov-val">{{ totalStudents() }}</span>
                  <div class="ov-bar-wrap">
                    <div class="ov-bar purple" [style.width]="'100%'"></div>
                  </div>
                </div>
              </div>
              <div class="ov-item">
                <div class="ov-left">
                  <div class="ov-dot orange"></div>
                  <span>Jami darslar</span>
                </div>
                <div class="ov-right">
                  <span class="ov-val">{{ totalLessons() }}</span>
                  <div class="ov-bar-wrap">
                    <div class="ov-bar orange" [style.width]="'100%'"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Platform Score -->
            <div class="score-card">
              <div class="score-left">
                <div class="score-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" class="track"/>
                    <circle cx="50" cy="50" r="42" class="progress"
                            [style.stroke-dashoffset]="scoreOffset"/>
                  </svg>
                  <div class="score-val">{{ platformScore }}%</div>
                </div>
              </div>
              <div class="score-right">
                <p class="score-title">Platform faollik darajasi</p>
                <p class="score-desc">
                  {{ activeModules() }} ta faol modul, {{ totalStudents() }} ta talaba bilan platform yaxshi ishlayapti.
                </p>
                <div class="score-stars">
                  @for (i of [1,2,3,4,5]; track i) {
                    <mat-icon [class.filled]="i <= starRating">star</mat-icon>
                  }
                </div>
              </div>
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn 0.5s ease-out;
    }

    /* ===== HERO ===== */
    .hero-banner {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
      border-radius: 24px;
      padding: 40px 48px;
      margin-bottom: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(59,130,246,0.35);

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      }
    }

    .hero-left {
      position: relative;
      z-index: 2;
      max-width: 520px;
    }

    .greeting-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 100px;
      padding: 6px 16px;
      color: white;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 16px;

      .greeting-icon { font-size: 1rem; }
    }

    .hero-title {
      color: white;
      font-size: 2.25rem;
      font-weight: 800;
      margin-bottom: 12px;
      line-height: 1.2;
    }

    .hero-sub {
      color: rgba(255,255,255,0.8);
      font-size: 1rem;
      margin-bottom: 28px;
      line-height: 1.6;
    }

    .hero-btns {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-primary-hero {
      background: white !important;
      color: #1d4ed8 !important;
      font-weight: 600;
      padding: 10px 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      transition: all 0.2s;

      &:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.2); }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .btn-outline-hero {
      border-color: rgba(255,255,255,0.5) !important;
      color: white !important;
      font-weight: 600;
      padding: 10px 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      background: rgba(255,255,255,0.1) !important;

      &:hover { background: rgba(255,255,255,0.2) !important; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .hero-right {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .hero-illustration {
      position: relative;
      width: 160px;
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .illustration-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.2);
      animation: spin-slow 8s linear infinite;
    }

    .ring-1 { width: 160px; height: 160px; animation-duration: 8s; }
    .ring-2 { width: 120px; height: 120px; animation-duration: 6s; animation-direction: reverse; }
    .ring-3 { width: 80px; height: 80px; animation-duration: 4s; }

    .illustration-icon {
      width: 64px;
      height: 64px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.3);

      mat-icon {
        color: white;
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
    }

    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ===== STATS GRID ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }

    /* Skeleton */
    .stat-skeleton {
      background: white;
      border-radius: 20px;
      padding: 24px;
      border: 1px solid var(--gray-100);
      box-shadow: var(--shadow-sm);

      .sk {
        background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
      }
      .sk-icon { width: 52px; height: 52px; border-radius: 14px; margin-bottom: 20px; }
      .sk-num { width: 70px; height: 36px; margin-bottom: 10px; }
      .sk-label { width: 110px; height: 14px; }
    }

    /* Stat Card */
    .stat-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      transition: all 0.25s;
      opacity: 0;

      &.animate {
        animation: fadeInUp 0.5s ease-out forwards;
      }
      &:nth-child(1).animate { animation-delay: 0.05s; }
      &:nth-child(2).animate { animation-delay: 0.12s; }
      &:nth-child(3).animate { animation-delay: 0.19s; }
      &:nth-child(4).animate { animation-delay: 0.26s; }

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 16px 40px rgba(0,0,0,0.1);
      }
    }

    .stat-bg-shape {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      opacity: 0.08;
    }

    .stat-card.blue .stat-bg-shape { background: #3b82f6; }
    .stat-card.purple .stat-bg-shape { background: #8b5cf6; }
    .stat-card.green .stat-bg-shape { background: #10b981; }
    .stat-card.orange .stat-bg-shape { background: #f59e0b; }

    .stat-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .stat-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
        color: white;
      }
    }

    .stat-card.blue .stat-icon-wrap { background: linear-gradient(135deg, #60a5fa, #2563eb); box-shadow: 0 6px 20px rgba(37,99,235,0.35); }
    .stat-card.purple .stat-icon-wrap { background: linear-gradient(135deg, #a78bfa, #7c3aed); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }
    .stat-card.green .stat-icon-wrap { background: linear-gradient(135deg, #34d399, #059669); box-shadow: 0 6px 20px rgba(5,150,105,0.35); }
    .stat-card.orange .stat-icon-wrap { background: linear-gradient(135deg, #fbbf24, #d97706); box-shadow: 0 6px 20px rgba(217,119,6,0.35); }

    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 100px;

      &.up { background: #dcfce7; color: #16a34a; }
      &.down { background: #fee2e2; color: #dc2626; }

      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .stat-num {
      font-size: 2.75rem;
      font-weight: 800;
      color: var(--gray-900);
      line-height: 1;
      margin-bottom: 6px;
    }

    .stat-lbl {
      font-size: 0.88rem;
      color: var(--gray-500);
      font-weight: 500;
      margin-bottom: 16px;
    }

    .stat-bar {
      height: 4px;
      background: var(--gray-100);
      border-radius: 100px;
      overflow: hidden;
    }

    .stat-fill {
      height: 100%;
      border-radius: 100px;
      transition: width 1s ease-out;
    }

    .stat-card.blue .stat-fill { background: linear-gradient(90deg, #60a5fa, #2563eb); }
    .stat-card.purple .stat-fill { background: linear-gradient(90deg, #a78bfa, #7c3aed); }
    .stat-card.green .stat-fill { background: linear-gradient(90deg, #34d399, #059669); }
    .stat-card.orange .stat-fill { background: linear-gradient(90deg, #fbbf24, #d97706); }

    /* ===== BOTTOM GRID ===== */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .panel {
      background: white;
      border-radius: 20px;
      padding: 28px;
      border: 1px solid var(--gray-100);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .panel-head {
      margin-bottom: 24px;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 12px;

      h3 {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--gray-900);
        margin: 0;
      }
    }

    .panel-icon-wrap {
      width: 38px;
      height: 38px;
      background: var(--primary-50);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--primary-600);
      }
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .qa-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      background: var(--gray-50);
      border-radius: 14px;
      text-decoration: none;
      border: 1px solid transparent;
      transition: all 0.2s;
      cursor: pointer;

      &:hover {
        background: white;
        border-color: var(--primary-100);
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        transform: translateX(4px);

        .qa-arrow { color: var(--primary-500); }
      }
    }

    .qa-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { font-size: 22px; width: 22px; height: 22px; color: white; }

      &.blue { background: linear-gradient(135deg, #60a5fa, #2563eb); }
      &.purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
      &.green { background: linear-gradient(135deg, #34d399, #059669); }
      &.orange { background: linear-gradient(135deg, #fbbf24, #d97706); }
    }

    .qa-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .qa-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--gray-800);
      }
      .qa-desc {
        font-size: 0.78rem;
        color: var(--gray-500);
      }
    }

    .qa-arrow {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--gray-400);
      transition: color 0.2s;
    }

    /* Overview List */
    .overview-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .ov-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .ov-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 140px;

      span { font-size: 0.88rem; color: var(--gray-600); font-weight: 500; }
    }

    .ov-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;

      &.blue { background: #3b82f6; }
      &.green { background: #10b981; }
      &.purple { background: #8b5cf6; }
      &.orange { background: #f59e0b; }
    }

    .ov-right {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ov-val {
      font-size: 1rem;
      font-weight: 700;
      color: var(--gray-900);
      min-width: 32px;
      text-align: right;
    }

    .ov-bar-wrap {
      flex: 1;
      height: 6px;
      background: var(--gray-100);
      border-radius: 100px;
      overflow: hidden;
    }

    .ov-bar {
      height: 100%;
      border-radius: 100px;
      transition: width 1s ease-out;

      &.blue { background: linear-gradient(90deg, #93c5fd, #3b82f6); }
      &.green { background: linear-gradient(90deg, #6ee7b7, #10b981); }
      &.purple { background: linear-gradient(90deg, #c4b5fd, #8b5cf6); }
      &.orange { background: linear-gradient(90deg, #fcd34d, #f59e0b); }
    }

    /* Score Card */
    .score-card {
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      border: 1px solid var(--primary-100);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .score-circle {
      position: relative;
      width: 80px;
      height: 80px;
      flex-shrink: 0;

      svg {
        width: 80px;
        height: 80px;
        transform: rotate(-90deg);

        .track {
          fill: none;
          stroke: #e5e7eb;
          stroke-width: 8;
        }
        .progress {
          fill: none;
          stroke: url(#grad);
          stroke-width: 8;
          stroke-linecap: round;
          stroke-dasharray: 264;
          transition: stroke-dashoffset 1.2s ease-out;
          stroke: #3b82f6;
        }
      }
    }

    .score-val {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 800;
      color: var(--primary-700);
    }

    .score-right {
      flex: 1;
    }

    .score-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--gray-900);
      margin-bottom: 6px;
    }

    .score-desc {
      font-size: 0.8rem;
      color: var(--gray-600);
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .score-stars {
      display: flex;
      gap: 2px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--gray-200);

        &.filled { color: #f59e0b; }
      }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .hero-banner {
        padding: 28px 24px;
        flex-direction: column;
        gap: 24px;
      }
      .hero-title { font-size: 1.75rem; }
      .hero-right { display: none; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .bottom-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private teacherService = inject(TeacherService);
  private moduleService = inject(ModuleService);
  private studentService = inject(StudentService);
  private lessonService = inject(LessonService);

  loading = signal(true);
  totalModules = signal(0);
  totalStudents = signal(0);
  activeModules = signal(0);
  totalLessons = signal(0);

  teacher = this.teacherService.getCurrentTeacher();

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Xayrli tong';
    if (h < 17) return 'Xayrli kun';
    return 'Xayrli kech';
  }

  get greetingIcon(): string {
    const h = new Date().getHours();
    if (h < 12) return '🌅';
    if (h < 17) return '☀️';
    return '🌙';
  }

  get activePercent(): number {
    if (!this.totalModules()) return 0;
    return Math.round((this.activeModules() / this.totalModules()) * 100);
  }

  get platformScore(): number {
    if (!this.totalModules() && !this.totalStudents()) return 0;
    const base = Math.min(100, 40 + this.activePercent * 0.4 + Math.min(this.totalStudents() * 2, 30));
    return Math.round(base);
  }

  get scoreOffset(): number {
    const circumference = 2 * Math.PI * 42;
    return circumference - (this.platformScore / 100) * circumference;
  }

  get starRating(): number {
    return Math.ceil(this.platformScore / 20);
  }

  ngOnInit(): void {
    const teacher = this.teacherService.getCurrentTeacher();
    if (!teacher) return;

    let completed = 0;
    const checkDone = () => { if (++completed >= 3) this.loading.set(false); };

    this.moduleService.getAll(teacher.id).subscribe({
      next: (modules) => {
        this.totalModules.set(modules.length);
        this.activeModules.set(modules.filter(m => m.is_published).length);
        checkDone();
      },
      error: () => checkDone()
    });

    this.studentService.getAll(teacher.id).subscribe({
      next: (students) => { this.totalStudents.set(students.length); checkDone(); },
      error: () => checkDone()
    });

    this.lessonService.getAll().subscribe({
      next: (lessons) => { this.totalLessons.set(lessons.length); checkDone(); },
      error: () => checkDone()
    });
  }
}
