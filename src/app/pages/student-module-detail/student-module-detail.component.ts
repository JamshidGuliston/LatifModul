import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { StripHtmlPipe } from '../../shared/pipes/strip-html.pipe';
import { StudentAiChatComponent } from '../../shared/components/student-ai-chat/student-ai-chat.component';
import { ModuleService } from '../../core/services/module.service';
import { LessonService } from '../../core/services/lesson.service';
import { StudentService } from '../../core/services/student.service';
import { ProgressService } from '../../core/services/progress.service';
import { Module } from '../../core/models/module.model';
import { Lesson } from '../../core/models/lesson.model';
import { Student } from '../../core/models/student.model';
import { StudentLessonProgress } from '../../core/models/progress.model';

@Component({
  selector: 'app-student-module-detail',
  imports: [MatButtonModule, MatIconModule, TranslatePipe, StripHtmlPipe, StudentAiChatComponent],
  template: `
    <div class="student-page">
      <!-- Navbar -->
      <nav class="student-navbar">
        <div class="nav-content">
          <div class="brand" (click)="router.navigate(['/'])">
            <div class="logo-icon">
              <mat-icon>school</mat-icon>
            </div>
            <span class="brand-name">Info Teacher</span>
          </div>
          <div class="nav-right">
            <div class="student-info">
              <div class="student-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <span class="student-name">{{ currentStudent()?.full_name }}</span>
            </div>
            <button mat-stroked-button (click)="logout()">
              <mat-icon>logout</mat-icon>
              {{ 'auth.logout' | translate }}
            </button>
          </div>
        </div>
      </nav>

      <main class="main-content">
        <!-- Back button + Module header -->
        <div class="page-nav">
          <button mat-stroked-button (click)="router.navigate(['/student/modules'])">
            <mat-icon>arrow_back</mat-icon>
            {{ 'common.back' | translate }}
          </button>
        </div>

        @if (isLoading()) {
          <div class="loading">
            <mat-icon>hourglass_empty</mat-icon>
            <p>{{ 'common.loading' | translate }}</p>
          </div>
        } @else {
          @if (module()) {
            <div class="module-header">
              <div class="module-info">
                <h1>{{ module()!.title }}</h1>
                @if (module()!.description) {
                  <p class="module-desc">{{ module()!.description }}</p>
                }
                <div class="module-meta">
                  <span class="meta-badge">
                    <mat-icon>menu_book</mat-icon>
                    {{ lessons().length }} {{ 'landing.lessons' | translate }}
                  </span>
                </div>
              </div>
              @if (module()!.thumbnail) {
                <div class="module-thumb" [style.background-image]="'url(' + module()!.thumbnail + ')'"></div>
              }
            </div>
          }

          <!-- Lessons list -->
          <div class="lessons-section">
            <h2>{{ 'studentModule.lessonsTitle' | translate }}</h2>

            @if (lessons().length === 0) {
              <div class="empty-state">
                <mat-icon>school</mat-icon>
                <h3>{{ 'studentModule.noLessons' | translate }}</h3>
              </div>
            } @else {
              <div class="lessons-list">
                @for (lesson of lessons(); track lesson.id; let i = $index) {
                  <div class="lesson-card"
                       [class.locked]="isLessonLocked(lesson.id, i)"
                       (click)="openLesson(lesson.id, i)">
                    <div class="lesson-number" [class.locked-num]="isLessonLocked(lesson.id, i)">
                      @if (isLessonLocked(lesson.id, i)) {
                        <mat-icon>lock</mat-icon>
                      } @else {
                        {{ i + 1 }}
                      }
                    </div>
                    <div class="lesson-info">
                      <h3>{{ lesson.title }}</h3>
                      @if (lesson.description) {
                        <p>{{ lesson.description | stripHtml }}</p>
                      }
                      @if (!isLessonLocked(lesson.id, i) && getLessonCompletion(lesson.id) > 0) {
                        @let pct = getLessonCompletion(lesson.id);
                        @let req = lesson.required_completion_percent || 80;
                        <div class="lesson-progress-row">
                          <div class="lesson-progress-bar">
                            <div class="lesson-progress-fill"
                              [style.width.%]="pct"
                              [class.passed]="pct >= req">
                            </div>
                          </div>
                          <span class="lesson-progress-pct" [class.passed]="pct >= req">{{ pct }}%</span>
                        </div>
                      }
                    </div>
                      <div class="lesson-action-icon flex-center">
                        @if (isLessonLocked(lesson.id, i)) {
                          <div class="icon-circle lock-bg"><mat-icon>lock</mat-icon></div>
                        } @else if (getLessonCompletion(lesson.id) >= (lesson.required_completion_percent || 80)) {
                          <div class="icon-circle done-bg"><mat-icon>check_circle</mat-icon></div>
                        } @else {
                          <div class="icon-circle arrow-bg"><mat-icon>arrow_forward_ios</mat-icon></div>
                        }
                      </div>
                    </div>
                  }
                </div>
            }
          </div>
        }
      </main>

      <!-- Floating AI Chat -->
      <app-student-ai-chat />

    </div>
  `,
  styles: [`
    .student-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
    }

    .student-navbar {
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-content {
      max-width: 1280px;
      margin: 0 auto;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      background: var(--primary-600);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .brand-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--gray-900);
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .student-avatar {
      width: 32px;
      height: 32px;
      background: var(--primary-100);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary-600); }
    }

    .student-name {
      font-weight: 600;
      color: var(--gray-700);
      font-size: 0.9rem;
    }

    .main-content {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .page-nav {
      margin-bottom: 24px;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--gray-500);
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
      h3 { font-size: 1.1rem; color: var(--gray-600); margin: 0; }
    }

    .module-header {
      display: flex;
      gap: 32px;
      background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.8);
      margin-bottom: 40px;
      align-items: center;
    }

    .module-info {
      flex: 1;
      h1 { font-size: 2.2rem; font-weight: 800; color: var(--gray-900); margin: 0 0 12px; letter-spacing: -0.5px; }
    }

    .module-desc {
      color: var(--gray-600);
      font-size: 1.1rem;
      line-height: 1.6;
      margin: 0 0 24px;
    }

    .module-meta { display: flex; gap: 16px; }

    .meta-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--primary-50);
      color: var(--primary-700);
      padding: 8px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .module-thumb {
      width: 240px;
      height: 180px;
      border-radius: 20px;
      background-size: cover;
      background-position: center;
      background-color: var(--gray-100);
      flex-shrink: 0;
      box-shadow: 0 12px 24px rgba(0,0,0,0.1);
    }

    .lessons-section {
      h2 {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--gray-900);
        margin: 0 0 24px;
      }
    }

    .lessons-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .lesson-card {
      display: flex;
      align-items: center;
      gap: 20px;
      background: white;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &:hover:not(.locked) {
        transform: translateY(-4px) scale(1.01);
        box-shadow: 0 12px 30px rgba(37, 99, 235, 0.1);
        border-color: var(--primary-100);
      }

      &.locked {
        cursor: not-allowed;
        background: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(8px);
        border: 1px dashed var(--gray-300);
      }
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 6px;
        background: var(--primary-500);
        border-radius: 6px 0 0 6px;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      &:hover:not(.locked)::before {
        opacity: 1;
      }
    }

    .lesson-number {
      width: 54px;
      height: 54px;
      background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
      color: var(--primary-700);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.25rem;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.1);
      transition: all 0.3s;

      &.locked-num {
        background: var(--gray-100);
        color: var(--gray-400);
        box-shadow: none;
        mat-icon { font-size: 24px; width: 24px; height: 24px; }
      }
    }
    
    .lesson-card:hover:not(.locked) .lesson-number {
       background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
       color: white;
       transform: scale(1.05) rotate(-5deg);
       box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
    }

    .lesson-info {
      flex: 1;
      overflow: hidden;
      h3 { 
        font-size: 1.15rem; 
        font-weight: 700; 
        color: var(--gray-900); 
        margin: 0 0 6px; 
        transition: color 0.3s;
      }
      
      p {
        font-size: 0.95rem;
        color: var(--gray-500);
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.5;
      }
    }
    
    .lesson-card:hover:not(.locked) .lesson-info h3 {
      color: var(--primary-600);
    }

    .flex-center {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; margin-left: 2px; }
    }

    .arrow-bg {
      background: var(--primary-50);
      color: var(--primary-600);
    }

    .lesson-card:hover:not(.locked) .arrow-bg {
      background: var(--primary-500);
      color: white;
      transform: translateX(6px) scale(1.1);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .lock-bg {
      background: var(--gray-100);
      color: var(--gray-400);
      mat-icon { margin-left: 0; }
    }

    .done-bg {
      background: #d1fae5;
      color: #10b981;
      mat-icon { margin-left: 0; font-size: 24px; width: 24px; height: 24px; }
    }

    .lesson-progress-row {
      display: flex; align-items: center; gap: 12px; margin-top: 12px;
    }
    
    .lesson-progress-bar {
      flex: 1; height: 8px; background: var(--gray-100); border-radius: 10px; overflow: hidden;
      max-width: 180px;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
    }
    
    .lesson-progress-fill {
      height: 100%; 
      background: linear-gradient(90deg, #818cf8, #6366f1); 
      border-radius: 10px; 
      transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::after {
        content: '';
        position: absolute;
        top: 0; left: 0; bottom: 0; right: 0;
        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
        animation: shimmer 2s infinite;
      }
      
      &.passed { background: linear-gradient(90deg, #34d399, #10b981); }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .lesson-progress-pct {
      font-size: 0.85rem; font-weight: 800; color: #6366f1; white-space: nowrap;
      background: #e0e7ff;
      padding: 4px 10px;
      border-radius: 100px;
      &.passed { 
        color: #10b981; 
        background: #d1fae5;
      }
    }

    @media (max-width: 768px) {
      .module-header { flex-direction: column; padding: 24px; gap: 24px; }
      .module-thumb { width: 100%; height: 180px; }
      .lesson-card { flex-direction: column; align-items: flex-start; gap: 16px; padding: 20px;}
      .lesson-action-icon { align-self: flex-end; }
    }
  `]
})
export class StudentModuleDetailComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private moduleService = inject(ModuleService);
  private lessonService = inject(LessonService);
  private studentService = inject(StudentService);
  private progressService = inject(ProgressService);

  module = signal<Module | null>(null);
  lessons = signal<Lesson[]>([]);
  currentStudent = signal<Student | null>(null);
  isLoading = signal(true);
  private lessonProgressMap = signal<Map<string, StudentLessonProgress>>(new Map());

  ngOnInit() {
    this.currentStudent.set(this.studentService.getCurrentStudent());
    const moduleId = this.route.snapshot.paramMap.get('moduleId')!;

    this.moduleService.getById(moduleId).subscribe({
      next: (mod) => {
        this.module.set(mod);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.lessonService.getAll(moduleId).subscribe({
      next: (lessons) => {
        this.lessons.set(lessons);
        this.loadLessonProgress(moduleId);
      }
    });
  }

  private loadLessonProgress(moduleId: string) {
    this.progressService.getLessonProgress({ lesson__module: moduleId }).subscribe({
      next: (progressList) => {
        const map = new Map<string, StudentLessonProgress>();
        progressList.forEach(p => map.set(p.lesson, p));
        this.lessonProgressMap.set(map);
      }
    });
  }

  getLessonCompletion(lessonId: string): number {
    return this.lessonProgressMap().get(lessonId)?.completion_percent ?? 0;
  }

  isLessonLocked(lessonId: string, index: number): boolean {
    const mod = this.module();
    if (!mod?.is_sequential) return false;
    if (index === 0) return false;

    // Primary: check previous lesson's completion_percent vs its required threshold
    const prevLesson = this.lessons()[index - 1];
    if (prevLesson) {
      const prevPct = this.getLessonCompletion(prevLesson.id);
      const required = prevLesson.required_completion_percent ?? 80;
      if (prevPct >= required) return false;
    }

    // Fallback: check is_unlocked flag (set by backend or by our createLessonProgress call)
    const thisProgress = this.lessonProgressMap().get(lessonId);
    return !thisProgress?.is_unlocked;
  }

  openLesson(lessonId: string, index: number) {
    if (this.isLessonLocked(lessonId, index)) return;
    const moduleId = this.route.snapshot.paramMap.get('moduleId');
    this.router.navigate(['/student/modules', moduleId, 'lessons', lessonId]);
  }

  logout() {
    this.studentService.studentLogout();
    this.router.navigate(['/']);
  }
}
