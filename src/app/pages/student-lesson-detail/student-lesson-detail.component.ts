import { Component, inject, OnInit, signal, ViewChild, ElementRef, HostListener } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { StudentAiChatComponent } from '../../shared/components/student-ai-chat/student-ai-chat.component';
import { LessonService } from '../../core/services/lesson.service';
import { ContentService } from '../../core/services/content.service';
import { StudentService } from '../../core/services/student.service';
import { AssignmentService } from '../../core/services/assignment.service';
import { ProgressService } from '../../core/services/progress.service';
import { Lesson } from '../../core/models/lesson.model';
import { LessonContent } from '../../core/models/content.model';
import { Assignment } from '../../core/models/assignment.model';
import { AssignmentAttempt } from '../../core/models/progress.model';
import { Student } from '../../core/models/student.model';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-student-lesson-detail',
  imports: [MatButtonModule, MatIconModule, TranslatePipe, StudentAiChatComponent, DecimalPipe],
  template: `
    <div class="page-wrapper">

      <!-- Navbar -->
      <nav class="student-navbar">
        <div class="nav-content">
          <div class="nav-left">
            <button mat-icon-button (click)="goBack()" class="back-btn" title="Orqaga">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="brand" (click)="router.navigate(['/'])">
              <div class="logo-icon"><mat-icon>school</mat-icon></div>
              <span class="brand-name">Info Teacher</span>
            </div>
            @if (lesson()) {
              <span class="lesson-title-nav">{{ lesson()!.title }}</span>
            }
          </div>
          <div class="nav-right">
            <div class="student-info">
              <div class="student-avatar"><mat-icon>person</mat-icon></div>
              <span class="student-name">{{ currentStudent()?.full_name }}</span>
            </div>
            <button mat-stroked-button (click)="logout()">
              <mat-icon>logout</mat-icon>
              {{ 'auth.logout' | translate }}
            </button>
          </div>
        </div>
      </nav>

      <!-- Split layout -->
      <div class="split-container" #splitContainer [class.dragging]="isDragging">

        <!-- LEFT PANEL: Lesson content -->
        <div class="panel left-panel"
             [class.fullscreen]="leftFullscreen()"
             [class.hidden]="rightFullscreen()"
             [style.width]="getPanelWidth('left')">

          <div class="panel-toolbar">
            <span class="panel-title">
              <mat-icon>menu_book</mat-icon>
              Dars matni
            </span>
            <button mat-icon-button (click)="toggleFullscreen('left')"
                    [title]="leftFullscreen() ? 'Kichraytirish' : 'Kattalashtirish'">
              <mat-icon>{{ leftFullscreen() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
            </button>
          </div>

          <div class="panel-scroll">
            @if (isLoading()) {
              <div class="loading-state">
                <mat-icon>hourglass_empty</mat-icon>
                <p>{{ 'common.loading' | translate }}</p>
              </div>
            } @else {
              @if (lesson()) {
                <div class="lesson-header">
                  <h1>{{ lesson()!.title }}</h1>
                  @if (lesson()!.description) {
                    <div class="lesson-desc ql-editor" [innerHTML]="getSafeHtml(lesson()!.description || '')"></div>
                  }
                </div>
              }

              @if (contents().length === 0) {
                <div class="empty-state">
                  <mat-icon>folder_open</mat-icon>
                  <p>{{ 'studentLesson.noContent' | translate }}</p>
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
                        @if (c.content) {
                          <div class="text-content" [innerHTML]="getSafeHtml(c.content)"></div>
                        }
                        @if (c.video_url) {
                          <div class="video-content">
                            @if (getYoutubeEmbedUrl(c.video_url); as embedUrl) {
                              <iframe [src]="embedUrl" frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen></iframe>
                            } @else {
                              <video controls [src]="c.video_url"></video>
                            }
                          </div>
                        }
                        @if (c.file_url) {
                          <div class="file-actions">
                            <a [href]="resolveFileUrl(c.file_url)" target="_blank" class="file-btn file-btn-view">
                              <mat-icon>visibility</mat-icon> Ko'rish
                            </a>
                            <a [href]="resolveFileUrl(c.file_url)" [download]="getFileName(c.file_url)" class="file-btn file-btn-download">
                              <mat-icon>download</mat-icon> Yuklab olish
                            </a>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>

        <!-- DIVIDER -->
        @if (!leftFullscreen() && !rightFullscreen()) {
          <div class="divider" (mousedown)="startDrag($event)">
            <div class="divider-line"></div>
            <div class="divider-handle">
              <mat-icon>drag_indicator</mat-icon>
            </div>
            <div class="divider-line"></div>
          </div>
        }

        <!-- RIGHT PANEL: Assignments -->
        <div class="panel right-panel"
             [class.fullscreen]="rightFullscreen()"
             [class.hidden]="leftFullscreen()"
             [style.width]="getPanelWidth('right')">

          <div class="panel-toolbar">
            <span class="panel-title">
              <mat-icon>assignment</mat-icon>
              Topshiriqlar
              @if (assignments().length > 0) {
                <span class="badge">{{ assignments().length }}</span>
              }
            </span>
            <button mat-icon-button (click)="toggleFullscreen('right')"
                    [title]="rightFullscreen() ? 'Kichraytirish' : 'Kattalashtirish'">
              <mat-icon>{{ rightFullscreen() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
            </button>
          </div>

          <div class="panel-scroll">
            @if (assignments().length === 0) {
              <div class="empty-state">
                <mat-icon>assignment_turned_in</mat-icon>
                <p>Bu darsda topshiriqlar yo'q</p>
              </div>
            } @else {
              <div class="assignments-list">
                @for (a of assignments(); track a.id) {
                  <div class="assignment-card">
                    <div class="assignment-header">
                      <div class="assignment-icon">
                        <mat-icon>{{ getAssignmentIcon(a) }}</mat-icon>
                      </div>
                      <div class="assignment-meta">
                        <span class="assignment-type">{{ getAssignmentTypeName(a) }}</span>
                        <h3>{{ a.title }}</h3>
                      </div>
                      <div class="assignment-points">
                        <mat-icon>star</mat-icon>
                        {{ a.total_points }} pts
                      </div>
                    </div>

                    @if (a.description) {
                      <div class="assignment-desc" [innerHTML]="getSafeHtml(a.description)"></div>
                    }

                    <div class="assignment-footer">
                      @if (getAttempt(a.id); as attempt) {
                        <div class="attempt-result" [class.passed]="attempt.is_passed" [class.failed]="attempt.is_passed === false">
                          <mat-icon>{{ attempt.is_passed ? 'check_circle' : 'cancel' }}</mat-icon>
                          <span>{{ attempt.score ?? 0 }} / {{ attempt.max_score }} ball</span>
                          @if (attempt.percentage != null) {
                            <span class="percent">— {{ attempt.percentage | number:'1.0-1' }}%</span>
                          }
                          @if (attempt.is_passed === false) {
                            <span class="failed-label">Muvaffaqiyatsiz</span>
                          }
                        </div>
                      }
                      <div class="attempt-info">
                        <mat-icon>timer</mat-icon>
                        @if (a.time_limit) { {{ a.time_limit }} daqiqa · }
                        {{ a.attempts_allowed }} urinish
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

      </div>

      <!-- Floating AI Chat -->
      <app-student-ai-chat />
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .page-wrapper {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: #f1f5f9;
    }

    /* ── Navbar ── */
    .student-navbar {
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      z-index: 100;
      flex-shrink: 0;
    }

    .nav-content {
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .back-btn {
      flex-shrink: 0;
      color: var(--gray-600);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      background: var(--primary-600);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .brand-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--gray-900);
    }

    .lesson-title-nav {
      font-size: 0.85rem;
      color: var(--gray-500);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 400px;
      &::before { content: '/ '; color: var(--gray-300); }
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .student-avatar {
      width: 28px;
      height: 28px;
      background: var(--primary-100);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--primary-600); }
    }

    .student-name {
      font-weight: 600;
      color: var(--gray-700);
      font-size: 0.85rem;
    }

    /* ── Split container ── */
    .split-container {
      display: flex;
      flex: 1;
      overflow: hidden;
      gap: 0;

      &.dragging {
        user-select: none;
        cursor: col-resize;
      }
    }

    /* ── Panel ── */
    .panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.15s ease;
      min-width: 0;

      &.hidden {
        display: none;
      }

      &.fullscreen {
        width: 100% !important;
      }
    }

    .panel-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
      gap: 8px;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--gray-800);
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary-600); }
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-600);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      padding: 0 5px;
    }

    /* ── Scroll area ── */
    .panel-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 20px;

      /* Custom scrollbar */
      &::-webkit-scrollbar { width: 5px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
        &:hover { background: #9ca3af; }
      }
      scrollbar-width: thin;
      scrollbar-color: #d1d5db transparent;
    }

    /* ── Divider ── */
    .divider {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 12px;
      flex-shrink: 0;
      cursor: col-resize;
      background: #e5e7eb;
      transition: background 0.2s;
      gap: 2px;
      position: relative;

      &:hover, &:active {
        background: var(--primary-100);

        .divider-handle {
          background: var(--primary-600);
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .divider-line {
          background: var(--primary-300);
        }
      }
    }

    .divider-line {
      width: 2px;
      flex: 1;
      background: #d1d5db;
      border-radius: 1px;
      max-height: 80px;
    }

    .divider-handle {
      width: 24px;
      height: 48px;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #6b7280;
      }
    }

    /* ── Left panel content ── */
    .lesson-header {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      margin-bottom: 16px;

      h1 {
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--gray-900);
        margin: 0 0 10px;
        line-height: 1.4;
      }
    }

    .lesson-desc {
      color: var(--gray-700);
      font-size: 0.9rem;
      line-height: 1.7;
      padding: 0 !important;
      border: none !important;
      img { max-width: 100%; border-radius: 8px; }
      p { margin: 0 0 8px; }
    }

    .contents-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .content-block {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .content-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      border-bottom: 1px solid #f3f4f6;
      mat-icon { color: var(--primary-600); font-size: 20px; width: 20px; height: 20px; }
      h3 { font-size: 0.95rem; font-weight: 600; color: var(--gray-900); margin: 0; }
    }

    .content-body {
      padding: 18px;
    }

    .text-content {
      color: var(--gray-700);
      font-size: 0.9rem;
      line-height: 1.8;
      word-wrap: break-word;
      p { margin: 0 0 10px; }
      ul, ol { padding-left: 22px; margin: 0 0 10px; }
      code { background: #f3f4f6; padding: 2px 5px; border-radius: 3px; font-size: 0.85rem; }
      pre {
        background: #1e293b;
        color: #e2e8f0;
        padding: 14px;
        border-radius: 8px;
        overflow-x: auto;
        font-size: 0.82rem;
        line-height: 1.5;
      }
      img { max-width: 100%; border-radius: 8px; }
    }

    .video-content {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      border-radius: 10px;
      overflow: hidden;
      background: black;
      iframe, video {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
      }
    }

    .file-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .file-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.85rem;
      transition: background 0.2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .file-btn-view {
      background: var(--primary-50);
      color: var(--primary-700);
      &:hover { background: var(--primary-100); }
    }

    .file-btn-download {
      background: #f0fdf4;
      color: #15803d;
      &:hover { background: #dcfce7; }
    }

    /* ── Right panel: assignments ── */
    .assignments-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .assignment-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      overflow: hidden;
      border: 1px solid #f1f5f9;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
    }

    .assignment-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid #f3f4f6;
    }

    .assignment-icon {
      width: 36px;
      height: 36px;
      background: var(--primary-50);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--primary-600); }
    }

    .assignment-meta {
      flex: 1;
      min-width: 0;
    }

    .assignment-type {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary-600);
      background: var(--primary-50);
      padding: 2px 7px;
      border-radius: 4px;
    }

    .assignment-meta h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--gray-900);
      margin: 4px 0 0;
    }

    .assignment-points {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #d97706;
      flex-shrink: 0;
      mat-icon { font-size: 15px; width: 15px; height: 15px; color: #f59e0b; }
    }

    .assignment-desc {
      padding: 12px 16px;
      font-size: 0.85rem;
      color: var(--gray-600);
      line-height: 1.6;
      border-bottom: 1px solid #f3f4f6;
      p { margin: 0; }
    }

    .assignment-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      gap: 8px;
      flex-wrap: wrap;
    }

    .attempt-result {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.82rem;
      font-weight: 600;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }

      &.passed {
        color: #15803d;
        mat-icon { color: #22c55e; }
      }

      &.failed {
        color: #dc2626;
        mat-icon { color: #ef4444; }
      }
    }

    .percent { color: var(--gray-500); font-weight: 400; }

    .failed-label {
      background: #fee2e2;
      color: #dc2626;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .attempt-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      color: var(--gray-400);
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* ── Loading / Empty states ── */
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--gray-400);
      gap: 8px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; }
      p { margin: 0; font-size: 0.9rem; color: var(--gray-500); }
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .split-container { flex-direction: column; }
      .panel { width: 100% !important; }
      .divider { display: none; }
      .lesson-title-nav { display: none; }
    }
  `]
})
export class StudentLessonDetailComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private lessonService = inject(LessonService);
  private contentService = inject(ContentService);
  private studentService = inject(StudentService);
  private assignmentService = inject(AssignmentService);
  private progressService = inject(ProgressService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('splitContainer') splitContainer!: ElementRef;

  lesson = signal<Lesson | null>(null);
  contents = signal<LessonContent[]>([]);
  assignments = signal<Assignment[]>([]);
  attempts = signal<AssignmentAttempt[]>([]);
  currentStudent = signal<Student | null>(null);
  isLoading = signal(true);

  // Split panel state
  leftWidthPercent = signal(55);
  leftFullscreen = signal(false);
  rightFullscreen = signal(false);

  isDragging = false;
  private dragStartX = 0;
  private dragStartWidth = 0;

  ngOnInit() {
    this.currentStudent.set(this.studentService.getCurrentStudent());
    const lessonId = this.route.snapshot.paramMap.get('lessonId')!;

    this.lessonService.getById(lessonId).subscribe({
      next: (lesson) => { this.lesson.set(lesson); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });

    this.contentService.getLessonContents(lessonId).subscribe({
      next: (contents) => this.contents.set(contents)
    });

    this.assignmentService.getAll(lessonId).subscribe({
      next: (assignments) => {
        this.assignments.set(assignments);
        this.loadAttempts(assignments.map(a => a.id));
      }
    });
  }

  private loadAttempts(assignmentIds: string[]) {
    if (!assignmentIds.length) return;
    this.progressService.getAttempts().subscribe({
      next: (attempts) => {
        const filtered = attempts.filter(a => assignmentIds.includes(a.assignment));
        this.attempts.set(filtered);
      }
    });
  }

  getAttempt(assignmentId: string): AssignmentAttempt | undefined {
    const all = this.attempts().filter(a => a.assignment === assignmentId);
    if (!all.length) return undefined;
    return all.reduce((best, cur) =>
      (cur.percentage ?? 0) > (best.percentage ?? 0) ? cur : best
    );
  }

  // ── Drag to resize ──
  startDrag(event: MouseEvent) {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartWidth = this.leftWidthPercent();
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    const container = this.splitContainer?.nativeElement;
    if (!container) return;
    const containerWidth = container.offsetWidth;
    const dx = event.clientX - this.dragStartX;
    const newWidth = this.dragStartWidth + (dx / containerWidth * 100);
    this.leftWidthPercent.set(Math.max(20, Math.min(78, newWidth)));
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }

  getPanelWidth(side: 'left' | 'right'): string {
    if (this.leftFullscreen() || this.rightFullscreen()) return '100%';
    if (side === 'left') {
      return `calc(${this.leftWidthPercent()}% - 6px)`;
    } else {
      return `calc(${100 - this.leftWidthPercent()}% - 6px)`;
    }
  }

  toggleFullscreen(side: 'left' | 'right') {
    if (side === 'left') {
      this.leftFullscreen.set(!this.leftFullscreen());
      if (this.rightFullscreen()) this.rightFullscreen.set(false);
    } else {
      this.rightFullscreen.set(!this.rightFullscreen());
      if (this.leftFullscreen()) this.leftFullscreen.set(false);
    }
  }

  // ── Helpers ──
  getContentIcon(typeName: string | undefined): string {
    const icons: Record<string, string> = {
      video: 'videocam', text: 'article', file: 'attach_file',
      image: 'image', audio: 'audiotrack'
    };
    return icons[typeName?.toLowerCase() ?? ''] || 'folder';
  }

  getAssignmentIcon(a: Assignment): string {
    const type = (a.assignment_type ?? '').toLowerCase();
    if (type.includes('quiz') || type.includes('test')) return 'quiz';
    if (type.includes('writing') || type.includes('essay')) return 'edit_note';
    if (type.includes('upload') || type.includes('file')) return 'upload_file';
    return 'assignment';
  }

  getAssignmentTypeName(a: Assignment): string {
    return a.assignment_type ?? 'Topshiriq';
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  resolveFileUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return environment.apiUrl.replace('/api', '') + url;
  }

  getFileName(url: string): string {
    return url.split('/').pop() || 'file';
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
