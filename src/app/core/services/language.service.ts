import { Injectable, signal } from '@angular/core';
import { uz } from '../../i18n/uz';
import { en } from '../../i18n/en';

export type Lang = 'uz' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translations: Record<Lang, Record<string, string>> = { uz, en };
  currentLang = signal<Lang>(this.getSavedLang());

  private getSavedLang(): Lang {
    return (localStorage.getItem('lang') as Lang) || 'uz';
  }

  setLang(lang: Lang): void {
    localStorage.setItem('lang', lang);
    this.currentLang.set(lang);
  }

  t(key: string): string {
    return this.translations[this.currentLang()]?.[key] || key;
  }
}
