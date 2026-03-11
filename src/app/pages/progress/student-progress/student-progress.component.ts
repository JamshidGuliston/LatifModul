import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { ProgressService } from '../../../core/services/progress.service';
import { StudentService } from '../../../core/services/student.service';
import { StudentLessonProgress, AssignmentAttempt } from '../../../core/models/progress.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-student-progress',
  imports: [
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule,
    TranslatePipe, LoadingSpinnerComponent, DatePipe
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button (click)="router.navigate(['/progress'])">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h2>{{ studentName() }} - {{ 'progress.lessonProgress' | translate }}</h2>
    </div>

    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <h3>{{ 'progress.lessonProgress' | translate }}</h3>
      <table mat-table [dataSource]="lessonProgress()" class="full-width">
        <ng-container matColumnDef="lesson_title">
          <th mat-header-cell *matHeaderCellDef>{{ 'lessons.title' | translate }}</th>
          <td mat-cell *matCellDef="let lp">{{ lp.lesson_title }}</td>
        </ng-container>

        <ng-container matColumnDef="completion_percent">
          <th mat-header-cell *matHeaderCellDef>{{ 'progress.percent' | translate }}</th>
          <td mat-cell *matCellDef="let lp">{{ lp.completion_percent }}%</td>
        </ng-container>

        <ng-container matColumnDef="is_unlocked">
          <th mat-header-cell *matHeaderCellDef>{{ 'common.status' | translate }}</th>
          <td mat-cell *matCellDef="let lp">
            <mat-chip [highlighted]="lp.is_unlocked">
              {{ (lp.is_unlocked ? 'common.active' : 'common.inactive') | translate }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="started_at">
          <th mat-header-cell *matHeaderCellDef>{{ 'common.date' | translate }}</th>
          <td mat-cell *matCellDef="let lp">{{ lp.started_at ? (lp.started_at | date:'mediumDate') : '-' }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="lessonColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: lessonColumns;"></tr>
      </table>

      @if (lessonProgress().length === 0) {
        <p class="no-data">{{ 'common.noData' | translate }}</p>
      }

      <h3 style="margin-top: 24px;">{{ 'progress.attempts' | translate }}</h3>
      <table mat-table [dataSource]="attempts()" class="full-width">
        <ng-container matColumnDef="assignment_title">
          <th mat-header-cell *matHeaderCellDef>{{ 'assignments.title' | translate }}</th>
          <td mat-cell *matCellDef="let a">{{ a.assignment_title }}</td>
        </ng-container>

        <ng-container matColumnDef="attempt_number">
          <th mat-header-cell *matHeaderCellDef>#</th>
          <td mat-cell *matCellDef="let a">{{ a.attempt_number }}</td>
        </ng-container>

        <ng-container matColumnDef="score">
          <th mat-header-cell *matHeaderCellDef>{{ 'progress.score' | translate }}</th>
          <td mat-cell *matCellDef="let a">{{ a.score ?? '-' }} / {{ a.max_score }}</td>
        </ng-container>

        <ng-container matColumnDef="percentage">
          <th mat-header-cell *matHeaderCellDef>{{ 'progress.percent' | translate }}</th>
          <td mat-cell *matCellDef="let a">{{ a.percentage ?? '-' }}%</td>
        </ng-container>

        <ng-container matColumnDef="is_passed">
          <th mat-header-cell *matHeaderCellDef>{{ 'common.status' | translate }}</th>
          <td mat-cell *matCellDef="let a">
            @if (a.is_passed !== null && a.is_passed !== undefined) {
              <mat-chip [highlighted]="a.is_passed">
                {{ (a.is_passed ? 'progress.passed' : 'progress.failed') | translate }}
              </mat-chip>
            } @else {
              -
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="started_at">
          <th mat-header-cell *matHeaderCellDef>{{ 'common.date' | translate }}</th>
          <td mat-cell *matCellDef="let a">{{ a.started_at | date:'medium' }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="attemptColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: attemptColumns;"></tr>
      </table>

      @if (attempts().length === 0) {
        <p class="no-data">{{ 'common.noData' | translate }}</p>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .no-data { text-align: center; color: #999; padding: 16px; }
  `]
})
export class StudentProgressComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private progressService = inject(ProgressService);
  private studentService = inject(StudentService);

  loading = signal(true);
  studentName = signal('');
  lessonProgress = signal<StudentLessonProgress[]>([]);
  attempts = signal<AssignmentAttempt[]>([]);
  lessonColumns = ['lesson_title', 'completion_percent', 'is_unlocked', 'started_at'];
  attemptColumns = ['assignment_title', 'attempt_number', 'score', 'percentage', 'is_passed', 'started_at'];

  ngOnInit(): void {
    const studentId = this.route.snapshot.params['studentId'];

    this.studentService.getById(studentId).subscribe(s => this.studentName.set(s.full_name));

    let completed = 0;
    const checkDone = () => { if (++completed >= 2) this.loading.set(false); };

    this.progressService.getLessonProgress({ student_id: studentId }).subscribe({
      next: (data) => { this.lessonProgress.set(data); checkDone(); },
      error: () => checkDone()
    });

    this.progressService.getAttempts({ student_id: studentId }).subscribe({
      next: (data) => { this.attempts.set(data); checkDone(); },
      error: () => checkDone()
    });
  }
}
