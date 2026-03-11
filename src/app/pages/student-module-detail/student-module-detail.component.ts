import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ModuleService } from '../../core/services/module.service';
import { LessonService } from '../../core/services/lesson.service';
import { StudentService } from '../../core/services/student.service';
import { Module } from '../../core/models/module.model';
import { Lesson } from '../../core/models/lesson.model';
import { Student } from '../../core/models/student.model';

@Component({
  selector: 'app-student-module-detail',
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="student-page">
      <!-- Navbar -->
      <nav class="student-navbar">
        <div class="nav-content">
          <div class="brand" (click)="router.navigate(['/'])">
            <div class="logo-icon">
              <mat-icon>school</mat-icon>
            </div>
            <span class="brand-name">Latif Modul</span>
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
                  <div class="lesson-card" (click)="openLesson(lesson.id)">
                    <div class="lesson-number">{{ i + 1 }}</div>
                    <div class="lesson-info">
                      <h3>{{ lesson.title }}</h3>
                      @if (lesson.description) {
                        <p>{{ lesson.description }}</p>
                      }
                    </div>
                    <mat-icon class="lesson-arrow">chevron_right</mat-icon>
                  </div>
                }
              </div>
            }
          </div>
        }
      </main>
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
      gap: 24px;
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 32px;
    }

    .module-info {
      flex: 1;
      h1 { font-size: 1.75rem; font-weight: 700; color: var(--gray-900); margin: 0 0 8px; }
    }

    .module-desc {
      color: var(--gray-500);
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0 0 16px;
    }

    .module-meta { display: flex; gap: 16px; }

    .meta-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--primary-50);
      color: var(--primary-700);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .module-thumb {
      width: 200px;
      min-height: 140px;
      border-radius: 12px;
      background-size: cover;
      background-position: center;
      background-color: var(--gray-100);
      flex-shrink: 0;
    }

    .lessons-section {
      h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--gray-900);
        margin: 0 0 20px;
      }
    }

    .lessons-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .lesson-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
    }

    .lesson-number {
      width: 40px;
      height: 40px;
      background: var(--primary-100);
      color: var(--primary-700);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .lesson-info {
      flex: 1;
      h3 { font-size: 1rem; font-weight: 600; color: var(--gray-900); margin: 0 0 2px; }
      p { font-size: 0.85rem; color: var(--gray-500); margin: 0; }
    }

    .lesson-arrow {
      color: var(--gray-400);
    }

    @media (max-width: 768px) {
      .module-header { flex-direction: column; }
      .module-thumb { width: 100%; height: 180px; }
    }
  `]
})
export class StudentModuleDetailComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private moduleService = inject(ModuleService);
  private lessonService = inject(LessonService);
  private studentService = inject(StudentService);

  module = signal<Module | null>(null);
  lessons = signal<Lesson[]>([]);
  currentStudent = signal<Student | null>(null);
  isLoading = signal(true);

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
      next: (lessons) => this.lessons.set(lessons)
    });
  }

  openLesson(lessonId: string) {
    const moduleId = this.route.snapshot.paramMap.get('moduleId');
    this.router.navigate(['/student/modules', moduleId, 'lessons', lessonId]);
  }

  logout() {
    this.studentService.studentLogout();
    this.router.navigate(['/']);
  }
}
