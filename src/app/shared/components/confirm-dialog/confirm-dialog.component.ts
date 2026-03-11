import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface ConfirmDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="dialog-container">
      <div class="dialog-icon">
        <mat-icon>warning_amber</mat-icon>
      </div>

      <h2 class="dialog-title">{{ data.title }}</h2>

      <p class="dialog-message">{{ data.message }}</p>

      <div class="dialog-actions">
        <button class="btn btn-secondary" mat-dialog-close>
          <mat-icon>close</mat-icon>
          {{ 'common.cancel' | translate }}
        </button>
        <button class="btn btn-danger" [mat-dialog-close]="true">
          <mat-icon>delete</mat-icon>
          {{ 'common.yes' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 24px;
      text-align: center;
      min-width: 320px;
    }

    .dialog-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      background: var(--warning-light);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.3s ease-out;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--warning);
      }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .dialog-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--gray-900);
      margin: 0 0 12px;
    }

    .dialog-message {
      font-size: 0.95rem;
      color: var(--gray-600);
      margin: 0 0 24px;
      line-height: 1.5;
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: var(--radius);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .btn-secondary {
      background: var(--gray-100);
      color: var(--gray-700);

      &:hover {
        background: var(--gray-200);
      }
    }

    .btn-danger {
      background: linear-gradient(135deg, var(--error) 0%, #dc2626 100%);
      color: var(--white);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
      }
    }
  `]
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
