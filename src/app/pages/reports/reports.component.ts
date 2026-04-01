import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AssignmentService } from '../../core/services/assignment.service';
import { ProgressService } from '../../core/services/progress.service';
import { StudentService } from '../../core/services/student.service';
import { TeacherService } from '../../core/services/teacher.service';
import { Assignment } from '../../core/models/assignment.model';
import { AssignmentAttempt } from '../../core/models/progress.model';
import { Student } from '../../core/models/student.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface StudentReport {
  student: Student;
  totalAttempts: number;
  submittedAttempts: number;
  avgPct: number;
  bestPct: number;
  passedCount: number;
}

interface AssignmentReport {
  assignment: Assignment;
  totalAttempts: number;
  avgPct: number;
  passRate: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [MatIconModule, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="ph-title">
          <mat-icon>bar_chart</mat-icon>
          <div>
            <h1>Hisobotlar</h1>
            <p>O'quvchilar va topshiriqlar bo'yicha umumiy statistika</p>
          </div>
        </div>
        <button class="btn-refresh" (click)="loadData()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon>
          Yangilash
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Ma'lumotlar yuklanmoqda...</p>
        </div>
      }

      @if (!loading()) {
        <!-- Summary Cards -->
        <div class="cards-row">
          <div class="stat-card blue">
            <div class="sc-icon"><mat-icon>people</mat-icon></div>
            <div class="sc-body">
              <span class="sc-num">{{ students().length }}</span>
              <span class="sc-label">Jami o'quvchilar</span>
            </div>
          </div>
          <div class="stat-card purple">
            <div class="sc-icon"><mat-icon>assignment</mat-icon></div>
            <div class="sc-body">
              <span class="sc-num">{{ assignments().length }}</span>
              <span class="sc-label">Jami topshiriqlar</span>
            </div>
          </div>
          <div class="stat-card green">
            <div class="sc-icon"><mat-icon>grading</mat-icon></div>
            <div class="sc-body">
              <span class="sc-num">{{ totalSubmitted() }}</span>
              <span class="sc-label">Topshirilgan urinishlar</span>
            </div>
          </div>
          <div class="stat-card orange">
            <div class="sc-icon"><mat-icon>emoji_events</mat-icon></div>
            <div class="sc-body">
              <span class="sc-num">{{ overallPassRate() | number:'1.0-1' }}%</span>
              <span class="sc-label">Umumiy o'tish foizi</span>
            </div>
          </div>
        </div>

        <!-- Student Performance Table -->
        <div class="section">
          <h2 class="section-title">
            <mat-icon>people</mat-icon>
            O'quvchilar reytingi
          </h2>
          @if (studentReports().length === 0) {
            <div class="no-data">Ma'lumot topilmadi</div>
          } @else {
            <div class="table-wrap">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>O'quvchi</th>
                    <th>Urinishlar</th>
                    <th>Topshirilgan</th>
                    <th>O'rtacha %</th>
                    <th>Eng yaxshi %</th>
                    <th>O'tdi</th>
                    <th>Daraja</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of studentReports(); track r.student.id; let i = $index) {
                    <tr>
                      <td class="rank-cell">
                        @if (i === 0) { <span class="rank gold">1</span> }
                        @else if (i === 1) { <span class="rank silver">2</span> }
                        @else if (i === 2) { <span class="rank bronze">3</span> }
                        @else { <span class="rank">{{ i + 1 }}</span> }
                      </td>
                      <td>
                        <div class="student-cell">
                          <div class="s-avatar">{{ r.student.full_name.charAt(0) }}</div>
                          <div class="s-info">
                            <span class="s-name">{{ r.student.full_name }}</span>
                            <span class="s-email">{{ r.student.email }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="num-cell">{{ r.totalAttempts }}</td>
                      <td class="num-cell">{{ r.submittedAttempts }}</td>
                      <td>
                        <div class="pct-bar">
                          <div class="pct-fill" [style.width.%]="r.avgPct" [class.good]="r.avgPct >= 60" [class.bad]="r.avgPct < 60"></div>
                          <span class="pct-txt">{{ r.avgPct | number:'1.0-1' }}%</span>
                        </div>
                      </td>
                      <td class="num-cell">{{ r.bestPct | number:'1.0-1' }}%</td>
                      <td class="num-cell">{{ r.passedCount }}</td>
                      <td>
                        @if (r.avgPct >= 85) { <span class="grade-badge a">A'lo</span> }
                        @else if (r.avgPct >= 70) { <span class="grade-badge b">Yaxshi</span> }
                        @else if (r.avgPct >= 60) { <span class="grade-badge c">Qoniqarli</span> }
                        @else if (r.submittedAttempts > 0) { <span class="grade-badge f">Qoniqarsiz</span> }
                        @else { <span class="grade-badge none">—</span> }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Assignment Statistics Table -->
        <div class="section">
          <h2 class="section-title">
            <mat-icon>assignment</mat-icon>
            Topshiriqlar statistikasi
          </h2>
          @if (assignmentReports().length === 0) {
            <div class="no-data">Ma'lumot topilmadi</div>
          } @else {
            <div class="table-wrap">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Topshiriq</th>
                    <th>Urinishlar</th>
                    <th>O'rtacha %</th>
                    <th>O'tish darajasi</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of assignmentReports(); track r.assignment.id) {
                    <tr>
                      <td>
                        <div class="assign-cell">
                          <mat-icon class="assign-ic">assignment</mat-icon>
                          <span>{{ r.assignment.title }}</span>
                        </div>
                      </td>
                      <td class="num-cell">{{ r.totalAttempts }}</td>
                      <td>
                        <div class="pct-bar">
                          <div class="pct-fill" [style.width.%]="r.avgPct" [class.good]="r.avgPct >= 60" [class.bad]="r.avgPct < 60"></div>
                          <span class="pct-txt">{{ r.avgPct | number:'1.0-1' }}%</span>
                        </div>
                      </td>
                      <td>
                        <div class="pct-bar">
                          <div class="pct-fill" [style.width.%]="r.passRate" [class.good]="r.passRate >= 60" [class.bad]="r.passRate < 60"></div>
                          <span class="pct-txt">{{ r.passRate | number:'1.0-1' }}%</span>
                        </div>
                      </td>
                      <td>
                        @if (r.totalAttempts === 0) {
                          <span class="status-chip neutral">Urinish yo'q</span>
                        } @else if (r.passRate >= 70) {
                          <span class="status-chip good">Yaxshi natija</span>
                        } @else if (r.passRate >= 50) {
                          <span class="status-chip avg">O'rtacha</span>
                        } @else {
                          <span class="status-chip bad">Qiyin</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 28px; display: flex; flex-direction: column; gap: 24px; }

    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .ph-title { display: flex; align-items: center; gap: 16px; }
    .ph-title mat-icon { font-size: 32px; width: 32px; height: 32px; color: #6366f1; }
    .ph-title h1 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin: 0; }
    .ph-title p { font-size: 0.85rem; color: #64748b; margin: 2px 0 0; }
    .btn-refresh {
      display: flex; align-items: center; gap: 7px; padding: 9px 18px;
      border: 1.5px solid #e2e8f0; border-radius: 10px; background: white;
      font-size: 0.85rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.15s;
      mat-icon { font-size: 17px; width: 17px; height: 17px; }
      &:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .loading-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 80px 20px; gap: 14px; color: #94a3b8;
      background: white; border-radius: 16px;
      p { font-size: 0.95rem; margin: 0; }
    }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #e2e8f0;
      border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .stat-card {
      display: flex; align-items: center; gap: 16px;
      padding: 20px; border-radius: 16px; background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .sc-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 26px; width: 26px; height: 26px; color: white; }
    }
    .stat-card.blue .sc-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .stat-card.purple .sc-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .stat-card.green .sc-icon { background: linear-gradient(135deg, #10b981, #059669); }
    .stat-card.orange .sc-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .sc-body { display: flex; flex-direction: column; gap: 3px; }
    .sc-num { font-size: 1.8rem; font-weight: 900; color: #1e293b; line-height: 1; }
    .sc-label { font-size: 0.78rem; color: #64748b; font-weight: 500; }

    .section {
      background: white; border-radius: 16px; padding: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .section-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 20px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #6366f1; }
    }
    .no-data { color: #94a3b8; font-size: 0.9rem; text-align: center; padding: 30px 0; }

    .table-wrap { overflow-x: auto; }
    .report-table {
      width: 100%; border-collapse: collapse;
      th {
        padding: 11px 14px; text-align: left; font-size: 0.72rem; font-weight: 700;
        color: #64748b; text-transform: uppercase; letter-spacing: 0.06em;
        background: #f8fafc; border-bottom: 1px solid #e2e8f0;
      }
      td { padding: 13px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 0.85rem; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #f8fafc; }
    }

    .rank-cell { width: 48px; text-align: center; }
    .rank {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 50%;
      font-size: 0.8rem; font-weight: 700; background: #f1f5f9; color: #64748b;
      &.gold { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; }
      &.silver { background: linear-gradient(135deg, #94a3b8, #64748b); color: white; }
      &.bronze { background: linear-gradient(135deg, #d97706, #b45309); color: white; }
    }

    .student-cell { display: flex; align-items: center; gap: 10px; }
    .s-avatar {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
      display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700;
    }
    .s-info { display: flex; flex-direction: column; gap: 1px; }
    .s-name { font-size: 0.88rem; font-weight: 600; color: #1e293b; }
    .s-email { font-size: 0.75rem; color: #94a3b8; }
    .num-cell { color: #475569; font-weight: 600; text-align: center; }

    .pct-bar { display: flex; align-items: center; gap: 10px; min-width: 140px; }
    .pct-fill {
      height: 6px; border-radius: 3px; min-width: 4px; transition: width 0.3s;
      &.good { background: linear-gradient(90deg, #10b981, #059669); }
      &.bad { background: linear-gradient(90deg, #ef4444, #dc2626); }
    }
    .pct-txt { font-size: 0.82rem; font-weight: 700; color: #475569; white-space: nowrap; }

    .grade-badge {
      padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;
      &.a { background: #d1fae5; color: #065f46; }
      &.b { background: #dbeafe; color: #1e40af; }
      &.c { background: #fef3c7; color: #92400e; }
      &.f { background: #fee2e2; color: #991b1b; }
      &.none { background: #f1f5f9; color: #94a3b8; }
    }

    .assign-cell { display: flex; align-items: center; gap: 8px; }
    .assign-ic { font-size: 16px; width: 16px; height: 16px; color: #6366f1; }

    .status-chip {
      padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      &.good { background: #d1fae5; color: #065f46; }
      &.avg { background: #fef3c7; color: #92400e; }
      &.bad { background: #fee2e2; color: #991b1b; }
      &.neutral { background: #f1f5f9; color: #64748b; }
    }

    @media (max-width: 768px) {
      .cards-row { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class ReportsComponent implements OnInit {
  private assignmentService = inject(AssignmentService);
  private progressService = inject(ProgressService);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);

  assignments = signal<Assignment[]>([]);
  students = signal<Student[]>([]);
  allAttempts = signal<AssignmentAttempt[]>([]);
  loading = signal(false);

  totalSubmitted = computed(() => this.allAttempts().filter(a => !!a.submitted_at).length);

  overallPassRate = computed(() => {
    const submitted = this.allAttempts().filter(a => !!a.submitted_at);
    if (!submitted.length) return 0;
    const passed = submitted.filter(a => a.is_passed === true).length;
    return (passed / submitted.length) * 100;
  });

  studentReports = computed((): StudentReport[] => {
    return this.students().map(student => {
      const attempts = this.allAttempts().filter(a => a.student === student.id);
      const submitted = attempts.filter(a => !!a.submitted_at);
      const pcts = submitted.map(a => a.percentage ?? 0);
      const avgPct = pcts.length ? pcts.reduce((s, v) => s + v, 0) / pcts.length : 0;
      const bestPct = pcts.length ? Math.max(...pcts) : 0;
      const passedCount = submitted.filter(a => a.is_passed === true).length;
      return { student, totalAttempts: attempts.length, submittedAttempts: submitted.length, avgPct, bestPct, passedCount };
    }).sort((a, b) => b.avgPct - a.avgPct);
  });

  assignmentReports = computed((): AssignmentReport[] => {
    return this.assignments().map(assignment => {
      const attempts = this.allAttempts().filter(a => a.assignment === assignment.id && !!a.submitted_at);
      const pcts = attempts.map(a => a.percentage ?? 0);
      const avgPct = pcts.length ? pcts.reduce((s, v) => s + v, 0) / pcts.length : 0;
      const passed = attempts.filter(a => a.is_passed === true).length;
      const passRate = attempts.length ? (passed / attempts.length) * 100 : 0;
      return { assignment, totalAttempts: attempts.length, avgPct, passRate };
    }).sort((a, b) => b.totalAttempts - a.totalAttempts);
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const teacher = this.teacherService.getCurrentTeacher();

    forkJoin({
      assignments: this.assignmentService.getAll().pipe(catchError(() => of([]))),
      students: this.studentService.getAll(teacher?.id).pipe(catchError(() => of([]))),
    }).subscribe(({ assignments, students }) => {
      this.assignments.set(assignments);
      this.students.set(students);

      // Load attempts for all assignments
      if (assignments.length === 0) { this.loading.set(false); return; }

      const attemptLoads = assignments.map(a =>
        this.progressService.getAttempts({ assignment_id: a.id }).pipe(catchError(() => of([])))
      );

      forkJoin(attemptLoads).subscribe(results => {
        const all = results.flat();
        this.allAttempts.set(all);
        this.loading.set(false);
      });
    });
  }
}
