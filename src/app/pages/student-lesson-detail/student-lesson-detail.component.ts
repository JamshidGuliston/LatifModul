import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { StudentAiChatComponent } from '../../shared/components/student-ai-chat/student-ai-chat.component';
import { LessonService } from '../../core/services/lesson.service';
import { ContentService } from '../../core/services/content.service';
import { StudentService } from '../../core/services/student.service';
import { Lesson } from '../../core/models/lesson.model';
import { LessonContent } from '../../core/models/content.model';
import { Student } from '../../core/models/student.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-student-lesson-detail',
  imports: [MatButtonModule, MatIconModule, TranslatePipe, StudentAiChatComponent],
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
        <div class="page-nav">
          <button mat-stroked-button (click)="goBack()">
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
          @if (lesson()) {
            <div class="lesson-header">
              <h1>{{ lesson()!.title }}</h1>
              @if (lesson()!.description) {
                <p class="lesson-desc">{{ lesson()!.description }}</p>
              }
            </div>
          }

          <!-- Contents -->
          @if (contents().length === 0) {
            <div class="empty-state">
              <mat-icon>folder_open</mat-icon>
              <h3>{{ 'studentLesson.noContent' | translate }}</h3>
            </div>
          } @else {
            <div class="contents-list">
              @for (c of contents(); track c.id) {
                <div class="content-block">
                  <div class="content-header">
                    <mat-icon>{{ getContentIcon(c.type_name) }}</mat-icon>
                    <h3>{{ c.title }}</h3>
                  </div>

                  <div class="content-body">
                    <!-- Text content -->
                    @if (c.content) {
                      <div class="text-content" [innerHTML]="c.content"></div>
                    }

                    <!-- Video content -->
                    @if (c.video_url) {
                      <div class="video-content">
                        @if (getYoutubeEmbedUrl(c.video_url); as embedUrl) {
                          <iframe
                            [src]="embedUrl"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                          </iframe>
                        } @else {
                          <video controls [src]="c.video_url" class="native-video"></video>
                        }
                      </div>
                    }

                    <!-- File content -->
                    @if (c.file_url) {
                      <a [href]="c.file_url" target="_blank" class="file-link">
                        <mat-icon>download</mat-icon>
                        {{ 'studentLesson.downloadFile' | translate }}
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          }
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

    .lesson-header {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 24px;

      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--gray-900);
        margin: 0 0 8px;
      }
    }

    .lesson-desc {
      color: var(--gray-500);
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0;
    }

    .contents-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .content-block {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .content-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      border-bottom: 1px solid var(--gray-100);

      mat-icon {
        color: var(--primary-600);
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--gray-900);
        margin: 0;
      }
    }

    .content-body {
      padding: 24px;
    }

    .text-content {
      color: var(--gray-700);
      font-size: 0.95rem;
      line-height: 1.8;
      word-wrap: break-word;

      p { margin: 0 0 12px; }
      ul, ol { padding-left: 24px; margin: 0 0 12px; }
      code {
        background: var(--gray-100);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.9rem;
      }
      pre {
        background: var(--gray-900);
        color: var(--gray-100);
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        font-size: 0.85rem;
        line-height: 1.5;
      }
    }

    .video-content {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      border-radius: 12px;
      overflow: hidden;
      background: black;

      iframe, video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }

    .native-video {
      border-radius: 12px;
    }

    .file-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: var(--primary-50);
      color: var(--primary-700);
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: background 0.2s;

      &:hover {
        background: var(--primary-100);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class StudentLessonDetailComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private lessonService = inject(LessonService);
  private contentService = inject(ContentService);
  private studentService = inject(StudentService);
  private sanitizer = inject(DomSanitizer);

  lesson = signal<Lesson | null>(null);
  contents = signal<LessonContent[]>([]);
  currentStudent = signal<Student | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.currentStudent.set(this.studentService.getCurrentStudent());
    const lessonId = this.route.snapshot.paramMap.get('lessonId')!;

    this.lessonService.getById(lessonId).subscribe({
      next: (lesson) => {
        this.lesson.set(lesson);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.contentService.getLessonContents(lessonId).subscribe({
      next: (contents) => this.contents.set(contents)
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
    const key = typeName?.toLowerCase() ?? '';
    return icons[key] || 'folder';
  }

  getYoutubeEmbedUrl(url: string): SafeResourceUrl | null {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
    if (match) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${match[1]}`);
    }
    return null;
  }

  goBack() {
    const moduleId = this.route.snapshot.paramMap.get('moduleId');
    this.router.navigate(['/student/modules', moduleId]);
  }

  logout() {
    this.studentService.studentLogout();
    this.router.navigate(['/']);
  }
}
