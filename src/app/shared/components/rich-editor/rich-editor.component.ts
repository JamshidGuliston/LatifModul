import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  ElementRef, ViewChild, inject, forwardRef, NgZone
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

/** Word-like rich text editor with image upload support */
@Component({
  selector: 'app-rich-editor',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichEditorComponent),
      multi: true,
    },
  ],
  template: `
    <div class="rich-editor-wrap" [class.focused]="focused">
      <!-- Toolbar -->
      <div class="toolbar" #toolbar>
        <div class="tool-group">
          <button type="button" class="tool-btn" title="Qalin (Bold)" (mousedown)="cmd('bold', $event)"><b>B</b></button>
          <button type="button" class="tool-btn italic" title="Qiya (Italic)" (mousedown)="cmd('italic', $event)"><i>I</i></button>
          <button type="button" class="tool-btn underline" title="Tagiga chiziq" (mousedown)="cmd('underline', $event)"><u>U</u></button>
          <button type="button" class="tool-btn strike" title="Ustiga chiziq" (mousedown)="cmd('strikethrough', $event)"><s>S</s></button>
        </div>

        <div class="tool-sep"></div>

        <div class="tool-group">
          <select class="tool-select" title="Matn o'lchami" (change)="cmdSize($event)">
            <option value="">O'lcham</option>
            <option value="1">Kichik</option>
            <option value="3">Normal</option>
            <option value="4">Katta</option>
            <option value="5">Kattaroq</option>
            <option value="6">Sarlavha</option>
          </select>
        </div>

        <div class="tool-sep"></div>

        <div class="tool-group">
          <button type="button" class="tool-btn" title="Tartibsiz ro'yxat" (mousedown)="cmd('insertUnorderedList', $event)">&#8226;&#8212;</button>
          <button type="button" class="tool-btn" title="Tartibli ro'yxat" (mousedown)="cmd('insertOrderedList', $event)">1&#8212;</button>
        </div>

        <div class="tool-sep"></div>

        <div class="tool-group">
          <button type="button" class="tool-btn" title="Chapga" (mousedown)="cmd('justifyLeft', $event)">&#8676;</button>
          <button type="button" class="tool-btn" title="Markazga" (mousedown)="cmd('justifyCenter', $event)">&#8596;</button>
          <button type="button" class="tool-btn" title="O'ngga" (mousedown)="cmd('justifyRight', $event)">&#8677;</button>
        </div>

        <div class="tool-sep"></div>

        <div class="tool-group">
          <button type="button" class="tool-btn img-btn" title="Rasm yuklash" (mousedown)="$event.preventDefault()" (click)="triggerImageUpload()">
            <span class="img-icon">&#128247;</span> Rasm
          </button>
          <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileSelected($event)">
        </div>

        @if (uploading) {
          <div class="upload-indicator">
            <div class="upload-spin"></div> Yuklanmoqda...
          </div>
        }
      </div>

      <!-- Editable area -->
      <div
        class="editor-area"
        contenteditable="true"
        #editorEl
        [attr.data-placeholder]="placeholder"
        (input)="onInput()"
        (focus)="focused = true"
        (blur)="onBlur()"
        (paste)="onPaste($event)"
      ></div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .rich-editor-wrap {
      border: 2px solid var(--gray-200, #e5e7eb);
      border-radius: 12px;
      background: var(--gray-50, #f9fafb);
      transition: all 0.18s;
      overflow: hidden;
      &.focused {
        background: white;
        border-color: var(--primary-500, #6366f1);
        box-shadow: 0 0 0 3px var(--primary-100, #e0e7ff);
      }
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-wrap: wrap;
      padding: 6px 10px;
      background: white;
      border-bottom: 1px solid var(--gray-200, #e5e7eb);
    }

    .tool-group { display: flex; align-items: center; gap: 2px; }

    .tool-sep {
      width: 1px; height: 20px;
      background: var(--gray-200, #e5e7eb);
      margin: 0 4px;
    }

    .tool-btn {
      min-width: 28px; height: 28px;
      padding: 0 6px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      color: var(--gray-700, #374151);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.12s;
      white-space: nowrap;
      &:hover { background: var(--gray-100, #f3f4f6); }
      &.italic { font-style: italic; }
      &.underline { text-decoration: underline; }
      &.strike { text-decoration: line-through; }
      &.img-btn { gap: 4px; color: var(--primary-600, #4f46e5); font-size: 0.8rem; font-weight: 600; }
    }

    .img-icon { font-size: 1rem; }

    .tool-select {
      height: 28px; padding: 0 6px;
      border: 1px solid var(--gray-200, #e5e7eb);
      border-radius: 6px;
      background: white;
      font-size: 0.8rem;
      color: var(--gray-700, #374151);
      cursor: pointer;
      outline: none;
    }

    .upload-indicator {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.78rem; color: var(--primary-600, #4f46e5);
      margin-left: 6px;
    }

    .upload-spin {
      width: 14px; height: 14px;
      border: 2px solid var(--primary-200, #c7d2fe);
      border-top-color: var(--primary-600, #4f46e5);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .editor-area {
      min-height: 120px;
      padding: 12px 14px;
      font-size: 0.93rem;
      color: var(--gray-900, #111827);
      outline: none;
      line-height: 1.6;
      font-family: inherit;

      &:empty::before {
        content: attr(data-placeholder);
        color: var(--gray-400, #9ca3af);
        pointer-events: none;
      }

      img {
        max-width: 100%;
        max-height: 300px;
        border-radius: 8px;
        margin: 4px 0;
        cursor: pointer;
        &:hover { opacity: 0.9; }
      }
    }
  `]
})
export class RichEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() placeholder = 'Savol matnini kiriting...';
  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private http = inject(HttpClient);
  private zone = inject(NgZone);

  focused = false;
  uploading = false;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ControlValueAccessor
  writeValue(val: string): void {
    // Defer until editorEl is available
    setTimeout(() => {
      if (this.editorEl) {
        const el = this.editorEl.nativeElement;
        if (el.innerHTML !== (val || '')) {
          el.innerHTML = val || '';
        }
      }
    });
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(disabled: boolean): void {
    if (this.editorEl) {
      this.editorEl.nativeElement.contentEditable = disabled ? 'false' : 'true';
    }
  }

  ngOnInit(): void {}
  ngOnDestroy(): void {}

  onInput(): void {
    const html = this.editorEl.nativeElement.innerHTML;
    this.onChange(html === '<br>' ? '' : html);
  }

  onBlur(): void {
    this.focused = false;
    this.onTouched();
  }

  onPaste(e: ClipboardEvent): void {
    // Strip formatting on paste — insert plain text
    const items = e.clipboardData?.items;
    if (!items) return;

    // Check if pasting an image file
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) this.uploadFile(file);
        return;
      }
    }
    // Plain text paste only (strip HTML)
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  cmd(command: string, e: MouseEvent): void {
    e.preventDefault();
    document.execCommand(command, false);
    this.editorEl.nativeElement.focus();
    this.onInput();
  }

  cmdSize(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    if (val) document.execCommand('fontSize', false, val);
    (e.target as HTMLSelectElement).value = '';
    this.editorEl.nativeElement.focus();
    this.onInput();
  }

  triggerImageUpload(): void {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    this.uploading = true;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('_token', environment.uploadToken);

    this.http.post<{ url: string }>(environment.uploadUrl, formData).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.uploading = false;
          this.editorEl.nativeElement.focus();
          document.execCommand('insertHTML', false, `<img src="${res.url}" alt="rasm">`);
          this.onInput();
        });
      },
      error: () => {
        this.zone.run(() => { this.uploading = false; });
      }
    });
  }
}
