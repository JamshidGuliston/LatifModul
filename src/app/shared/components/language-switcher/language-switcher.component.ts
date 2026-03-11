import { Component, inject } from '@angular/core';
import { LanguageService, Lang } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  imports: [],
  template: `
    <div class="lang-switcher">
      <button
        class="lang-btn"
        [class.active]="lang.currentLang() === 'uz'"
        (click)="lang.setLang('uz')"
      >
        <span class="lang-flag">🇺🇿</span>
        <span class="lang-code">UZ</span>
      </button>
      <button
        class="lang-btn"
        [class.active]="lang.currentLang() === 'en'"
        (click)="lang.setLang('en')"
      >
        <span class="lang-flag">🇬🇧</span>
        <span class="lang-code">EN</span>
      </button>
    </div>
  `,
  styles: [`
    .lang-switcher {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: var(--gray-100);
      border-radius: var(--radius-full);
    }

    .lang-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: none;
      background: transparent;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all var(--transition);
      font-weight: 500;
      font-size: 0.8rem;
      color: var(--gray-600);

      &:hover:not(.active) {
        background: var(--gray-200);
      }

      &.active {
        background: var(--white);
        color: var(--primary-600);
        box-shadow: var(--shadow-sm);
      }
    }

    .lang-flag {
      font-size: 1rem;
      line-height: 1;
    }

    .lang-code {
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.02em;
    }
  `]
})
export class LanguageSwitcherComponent {
  lang = inject(LanguageService);
}
