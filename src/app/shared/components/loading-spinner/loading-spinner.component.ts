import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  imports: [],
  template: `
    <div class="spinner-container">
      <div class="modern-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-core"></div>
      </div>
      <p class="loading-text">Yuklanmoqda...</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 48px;
      gap: 24px;
    }

    .modern-spinner {
      position: relative;
      width: 60px;
      height: 60px;
    }

    .spinner-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid transparent;
      animation: spin 1.5s linear infinite;
    }

    .spinner-ring:nth-child(1) {
      border-top-color: var(--primary-500);
      animation-duration: 1.5s;
    }

    .spinner-ring:nth-child(2) {
      inset: 6px;
      border-right-color: var(--primary-400);
      animation-duration: 2s;
      animation-direction: reverse;
    }

    .spinner-ring:nth-child(3) {
      inset: 12px;
      border-bottom-color: var(--primary-300);
      animation-duration: 2.5s;
    }

    .spinner-core {
      position: absolute;
      inset: 18px;
      background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-200) 100%);
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(0.9);
        opacity: 0.7;
      }
    }

    .loading-text {
      color: var(--gray-500);
      font-size: 0.9rem;
      font-weight: 500;
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class LoadingSpinnerComponent {}
