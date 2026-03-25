import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GeminiService } from '../../../core/services/gemini.service';
import { environment } from '../../../../environments/environment';

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

@Component({
    selector: 'app-student-ai-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
    template: `
    <!-- Floating Button -->
    <button class="chat-fab" (click)="toggleChat()" [class.hidden]="isOpen()" matTooltip="Gemini AI yordamchi">
      <mat-icon>smart_toy</mat-icon>
    </button>

    <!-- Chat Box -->
    <div class="chat-container" [class.open]="isOpen()">
      <!-- Header -->
      <div class="chat-header">
        <div class="header-info">
          <div class="ai-avatar">
            <mat-icon>smart_toy</mat-icon>
          </div>
          <div class="header-text">
            <h3>Gemini AI</h3>
            <span class="status">Online yordamchi</span>
          </div>
        </div>
        <button mat-icon-button (click)="toggleChat()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Messages Body -->
      <div class="chat-body" #scrollFrame>
        @if (messages().length === 0) {
          <div class="empty-state">
            <mat-icon>waving_hand</mat-icon>
            <h4>Salom!</h4>
            <p>Darslar bo'yicha tushunmagan savollaringizni bering. Men yordam berishga tayyorman!</p>
          </div>
        }

        @for (msg of messages(); track msg.id) {
          <div class="message-wrapper" [class.user]="msg.sender === 'user'">
            @if (msg.sender === 'ai') {
              <div class="msg-avatar ai">
                <mat-icon>smart_toy</mat-icon>
              </div>
            }
            <div class="message-bubble">
              <div class="message-text" [innerHTML]="formatMessage(msg.text)"></div>
              <div class="message-time">
                {{ msg.timestamp | date:'HH:mm' }}
              </div>
            </div>
          </div>
        }

        <!-- Loading Indicator -->
        @if (isTyping()) {
          <div class="message-wrapper ai typing">
            <div class="msg-avatar ai">
              <mat-icon>smart_toy</mat-icon>
            </div>
            <div class="message-bubble typing-bubble">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        }
      </div>

      <!-- Input Area -->
      <div class="chat-footer">
        @if (!hasApiKey) {
          <div class="api-warning">
            Iltimos, ishlatishdan oldin <code>environment.ts</code> da <code>geminiApiKey</code> kiriting.
          </div>
        }
        <div class="input-box">
          <input 
            type="text" 
            [(ngModel)]="newMessage" 
            (keyup.enter)="sendMessage()"
            [disabled]="isTyping() || !hasApiKey"
            placeholder="Savolingizni kiriting..."
          />
          <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim() || isTyping() || !hasApiKey">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .chat-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      border: none;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      mat-icon { font-size: 28px; width: 28px; height: 28px; }

      &:hover {
        transform: scale(1.1);
      }

      &.hidden {
        transform: scale(0);
        opacity: 0;
        pointer-events: none;
      }
    }

    .chat-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 360px;
      height: 600px;
      max-height: calc(100vh - 48px);
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      z-index: 10000;
      overflow: hidden;
      transform: translateY(20px) scale(0.9);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid #e5e7eb;

      &.open {
        transform: translateY(0) scale(1);
        opacity: 1;
        pointer-events: auto;
      }
    }

    .chat-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ai-avatar {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon { font-size: 20px; width: 20px; height: 20px; }
      }

      .header-text {
        display: flex;
        flex-direction: column;

        h3 { margin: 0; font-size: 1.05rem; font-weight: 600; }
        .status { font-size: 0.8rem; color: #bfdbfe; }
      }

      .close-btn { color: white; }
    }

    .chat-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }

    .empty-state {
      margin: auto;
      text-align: center;
      color: #64748b;

      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #94a3b8; margin-bottom: 12px; }
      h4 { font-size: 1.2rem; color: #334155; margin: 0 0 8px; }
      p { font-size: 0.9rem; line-height: 1.5; margin: 0; max-width: 240px; }
    }

    .message-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 85%;

      &.user {
        margin-left: auto;
        flex-direction: row-reverse;

        .message-bubble {
          background: #3b82f6;
          color: white;
          border-radius: 16px 16px 4px 16px;
        }

        .message-time { color: rgba(255, 255, 255, 0.7); text-align: right; }
      }

      &:not(.user) {
        margin-right: auto;

        .message-bubble {
          background: white;
          color: #1e293b;
          border-radius: 16px 16px 16px 4px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .message-time { color: #94a3b8; }
      }
    }

    .msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.ai {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    }

    .message-bubble {
      padding: 10px 14px;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .message-text {
      word-break: break-word;
      ::ng-deep pre {
        background: #1e293b;
        color: #f8fafc;
        padding: 8px;
        border-radius: 6px;
        overflow-x: auto;
        font-size: 0.85rem;
      }
      ::ng-deep code {
        font-family: inherit;
        background: rgba(0,0,0,0.05);
        padding: 2px 4px;
        border-radius: 4px;
      }
      ::ng-deep p { margin-top: 0; margin-bottom: 8px; }
      ::ng-deep p:last-child { margin-bottom: 0; }
    }

    .message-time {
      font-size: 0.7rem;
      margin-top: 4px;
    }

    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 14px 16px !important;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;

      &:nth-child(1) { animation-delay: -0.32s; }
      &:nth-child(2) { animation-delay: -0.16s; }
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .chat-footer {
      padding: 16px;
      background: white;
      border-top: 1px solid #f1f5f9;
    }

    .api-warning {
      font-size: 0.75rem;
      color: #b91c1c;
      background: #fef2f2;
      padding: 8px;
      border-radius: 6px;
      margin-bottom: 8px;
      text-align: center;
      code { font-weight: bold; }
    }

    .input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 4px 4px 4px 16px;
      transition: border-color 0.2s;

      &:focus-within {
        border-color: #3b82f6;
        background: white;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        padding: 8px 0;
        font-size: 0.95rem;

        &:disabled {
          opacity: 0.6;
        }
      }

      .send-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #3b82f6;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;

        mat-icon { font-size: 18px; width: 18px; height: 18px; margin-left: 2px; }

        &:hover:not(:disabled) {
          background: #2563eb;
        }

        &:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
      }
    }

    @media (max-width: 480px) {
      .chat-container {
        width: calc(100% - 32px);
        right: 16px;
        bottom: 16px;
      }
    }
  `]
})
export class StudentAiChatComponent implements AfterViewChecked {
    @ViewChild('scrollFrame') scrollFrame!: ElementRef;

    private geminiService = inject(GeminiService);

    isOpen = signal(false);
    messages = signal<ChatMessage[]>([]);
    newMessage = '';
    isTyping = signal(false);
    hasApiKey = !!environment.geminiApiKey;

    toggleChat() {
        this.isOpen.update(v => !v);
        if (this.isOpen() && this.messages().length === 0 && this.hasApiKey) {
            // Optional: initialize chat service ahead
            this.geminiService.startChat().catch(err => console.error("Could not start chat", err));
        }
    }

    async sendMessage() {
        const text = this.newMessage.trim();
        if (!text || !this.hasApiKey) return;

        // Add User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: text,
            timestamp: new Date()
        };

        this.messages.update(m => [...m, userMsg]);
        this.newMessage = '';
        this.isTyping.set(true);

        // Add wait time / loading state
        try {
            const response = await this.geminiService.sendMessage(text);

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: response,
                timestamp: new Date()
            };

            this.messages.update(m => [...m, aiMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: "Kechirasiz, xatolik yuz berdi. Javob olish imkoni bo'lmadi.",
                timestamp: new Date()
            };
            this.messages.update(m => [...m, errorMsg]);
        } finally {
            this.isTyping.set(false);
        }
    }

    formatMessage(text: string): string {
        // Simple replacements for bold, italic, code blocks.
        // Given the complexity of markdown, we'll do simple regex
        let formatted = text
            // escape html
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            // bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // code block
            .replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            // inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // line breaks
            .replace(/\n/g, '<br>');

        return formatted;
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        try {
            const el = this.scrollFrame.nativeElement;
            // Scroll only if newly added msgs push content down
            // Standard easy trick is just to scroll max
            el.scrollTop = el.scrollHeight;
        } catch (err) { }
    }
}
