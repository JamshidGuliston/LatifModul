
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ModuleService } from '../../core/services/module.service';
import { Module } from '../../core/models/module.model';
import { StudentService } from '../../core/services/student.service';
import { StudentAuthComponent } from '../student-auth/student-auth.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatDialogModule, TranslatePipe],
  template: `
    <div class="landing-container">
      <!-- Navbar -->
      <nav class="navbar glass">
        <div class="nav-content">
          <div class="brand">
            <div class="logo-icon">
              <mat-icon>school</mat-icon>
            </div>
            <span class="brand-name">Info Teacher</span>
          </div>
          <div class="nav-links">
            <a href="#home" class="nav-link">{{ 'landing.home' | translate }}</a>
            <a href="#modules" class="nav-link">{{ 'landing.modules' | translate }}</a>
            <a href="#about" class="nav-link">{{ 'landing.about' | translate }}</a>
          </div>
          <div class="nav-actions">
            @if (isStudentLoggedIn()) {
              <button mat-stroked-button (click)="goToStudentModules()">
                <mat-icon>dashboard</mat-icon>
                {{ 'landing.myModules' | translate }}
              </button>
            } @else {
              <button mat-stroked-button (click)="openAuthDialog()">
                {{ 'landing.login' | translate }}
              </button>
            }
            <button mat-flat-button color="primary" (click)="router.navigate(['/login'])" class="teacher-login-btn">
              {{ 'landing.teacherLogin' | translate }}
            </button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <header id="home" class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="highlight">{{ 'landing.heroHighlight' | translate }}</span> {{ 'landing.heroTitle' | translate }}
          </h1>
          <p class="hero-subtitle">
            {{ 'landing.heroSubtitle' | translate }}
          </p>
          <div class="hero-actions">
            <button mat-flat-button color="primary" class="cta-btn" (click)="onBoshlash()">
              {{ 'landing.start' | translate }}
              <mat-icon>arrow_forward</mat-icon>
            </button>
            <button mat-stroked-button class="secondary-btn" (click)="scrollToModules()">
              {{ 'landing.viewCourses' | translate }}
            </button>
          </div>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-value">{{ modules().length }}+</span>
              <span class="stat-label">{{ 'landing.statModules' | translate }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">500+</span>
              <span class="stat-label">{{ 'landing.statStudents' | translate }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">4.9</span>
              <span class="stat-label">{{ 'landing.statRating' | translate }}</span>
            </div>
          </div>
        </div>
        <div class="hero-image">
          <div class="image-wrapper">
             <!-- 3D Laptop Illustration -->
             <div class="laptop-3d">
               <div class="laptop-screen">
                 <div class="screen-content">
                   <div class="code-line line-1"></div>
                   <div class="code-line line-2"></div>
                   <div class="code-line line-3"></div>
                   <div class="code-line line-4"></div>
                   <div class="code-line line-5"></div>
                   <div class="screen-cursor"></div>
                 </div>
               </div>
               <div class="laptop-base"></div>
               <div class="laptop-shadow"></div>
             </div>

             <div class="floating-card card-1">
               <mat-icon>code</mat-icon>
               <span>Coding</span>
             </div>
             <div class="floating-card card-2">
               <mat-icon>psychology</mat-icon>
               <span>Logic</span>
             </div>
             <div class="floating-card card-3">
               <mat-icon>star</mat-icon>
               <span>4.9</span>
             </div>
             <div class="blob blob-1"></div>
             <div class="blob blob-2"></div>
          </div>
        </div>
      </header>

      <!-- Features Section -->
      <section id="features" class="features-section">
        <div class="section-header">
          <h2>{{ 'landing.features' | translate }}</h2>
          <p>{{ 'landing.featuresDesc' | translate }}</p>
        </div>
        <div class="features-grid">
          <div class="feature-card glass">
            <div class="feature-icon ai-icon">
              <mat-icon>smart_toy</mat-icon>
            </div>
            <h3>{{ 'landing.feat1Title' | translate }}</h3>
            <p>{{ 'landing.feat1Desc' | translate }}</p>
          </div>
          <div class="feature-card glass">
            <div class="feature-icon module-icon">
              <mat-icon>view_module</mat-icon>
            </div>
            <h3>{{ 'landing.feat2Title' | translate }}</h3>
            <p>{{ 'landing.feat2Desc' | translate }}</p>
          </div>
          <div class="feature-card glass">
            <div class="feature-icon test-icon">
              <mat-icon>quiz</mat-icon>
            </div>
            <h3>{{ 'landing.feat3Title' | translate }}</h3>
            <p>{{ 'landing.feat3Desc' | translate }}</p>
          </div>
          <div class="feature-card glass">
            <div class="feature-icon chart-icon">
              <mat-icon>trending_up</mat-icon>
            </div>
            <h3>{{ 'landing.feat4Title' | translate }}</h3>
            <p>{{ 'landing.feat4Desc' | translate }}</p>
          </div>
        </div>
      </section>

      <!-- Modules Section -->
      <section id="modules" class="modules-section">
        <div class="section-header">
          <h2>{{ 'landing.popularModules' | translate }}</h2>
          <p>{{ 'landing.popularModulesDesc' | translate }}</p>
        </div>

        <div class="modules-grid">
          @for (mod of modules(); track mod.id) {
            <div class="module-card glass">
              <div class="card-image" [style.background-image]="mod.thumbnail ? 'url(' + mod.thumbnail + ')' : ''">
                 @if (!mod.thumbnail) {
                   <div class="placeholder-icon">
                     <mat-icon>library_books</mat-icon>
                   </div>
                 }
              </div>
              <div class="card-content">
                <h3>{{ mod.title }}</h3>
                <p>{{ mod.description || ('landing.noDescription' | translate) }}</p>
                <div class="card-meta">
                  <div class="meta-item">
                    <mat-icon>menu_book</mat-icon>
                    <span>{{ mod.lessons_count || 0 }} {{ 'landing.lessons' | translate }}</span>
                  </div>
                </div>
                <button mat-stroked-button color="primary" class="view-btn" (click)="onBoshlash()">
                  {{ 'landing.start' | translate }}
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- About Section -->
      <section id="about" class="about-section">
        <div class="about-container glass">
           <div class="about-content">
             <h2>{{ 'landing.aboutTeacher' | translate }}</h2>
             <p class="bio">
               {{ 'landing.aboutBio' | translate }}
             </p>
             <ul class="skills-list">
               <li><mat-icon>check_circle</mat-icon> {{ 'landing.skill1' | translate }}</li>
               <li><mat-icon>check_circle</mat-icon> {{ 'landing.skill2' | translate }}</li>
               <li><mat-icon>check_circle</mat-icon> {{ 'landing.skill3' | translate }}</li>
             </ul>
           </div>
           <div class="about-image">
             <div class="avatar-placeholder">
               <mat-icon>person</mat-icon>
             </div>
           </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>Info Teacher</h3>
            <p>{{ 'landing.footerQuote' | translate }}</p>
          </div>
          <div class="footer-links">
            <h4>{{ 'landing.links' | translate }}</h4>
            <a href="#">{{ 'landing.aboutUs' | translate }}</a>
            <a href="#">{{ 'landing.contact' | translate }}</a>
          </div>
          <div class="footer-social">
            <h4>{{ 'landing.social' | translate }}</h4>
            <div class="social-icons">
              <a href="#"><mat-icon>public</mat-icon></a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 Info Teacher. {{ 'landing.rights' | translate }}</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    /* General Styles */
    .landing-container {
      font-family: 'Outfit', 'Inter', sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
      color: var(--gray-800);
      overflow-x: hidden;
    }

    .glass {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    /* Navbar */
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      padding: 16px 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .nav-content {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: var(--primary-600);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--gray-900);
    }

    .nav-links {
      display: flex;
      gap: 32px;
    }

    .nav-link {
      text-decoration: none;
      color: var(--gray-600);
      font-weight: 500;
      transition: color 0.2s;

      &:hover {
        color: var(--primary-600);
      }
    }

    .nav-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .teacher-login-btn {
      font-size: 0.85rem !important;
    }

    /* Hero Section */
    .hero-section {
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 120px 24px 60px;
      max-width: 1280px;
      margin: 0 auto;
      gap: 48px;
    }

    .hero-content {
      flex: 1;
      max-width: 600px;
    }

    .hero-title {
      font-size: 4rem;
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 24px;
      letter-spacing: -1px;
      color: var(--gray-900);
    }

    .highlight {
      background: linear-gradient(135deg, #2563eb, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--gray-600);
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      margin-bottom: 48px;
    }

    ::ng-deep .cta-btn {
      padding: 28px 40px !important;
      font-size: 1.15rem !important;
      border-radius: 100px !important;
      font-weight: 600 !important;
      background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3) !important;
      color: white !important;
      transition: transform 0.2s, box-shadow 0.2s !important;
    }
    ::ng-deep .cta-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 15px 35px rgba(37, 99, 235, 0.4) !important;
    }

    ::ng-deep .secondary-btn {
      padding: 28px 32px !important;
      font-size: 1.1rem !important;
      border-radius: 100px !important;
      border: 2px solid var(--primary-600) !important;
      color: var(--primary-600) !important;
      font-weight: 600 !important;
    }

    .stats-row {
      display: flex;
      gap: 48px;
      padding-top: 32px;
      border-top: 1px solid var(--gray-200);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-600);
    }

    .stat-label {
      font-size: 0.9rem;
      color: var(--gray-500);
    }

    /* Hero Image Area */
    .hero-image {
      flex: 1;
      position: relative;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
      z-index: -1;
    }

    .blob-1 {
      width: 300px;
      height: 300px;
      background: var(--primary-200);
      top: 50px;
      right: 50px;
      animation: float 6s ease-in-out infinite;
    }

    .blob-2 {
      width: 250px;
      height: 250px;
      background: var(--info-light);
      bottom: 50px;
      left: 50px;
      animation: float 8s ease-in-out infinite;
    }

    .image-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .floating-card {
      position: absolute;
      background: white;
      padding: 16px 24px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      animation: float 4s ease-in-out infinite;
    }

    .card-1 {
      top: 20%;
      right: 10%;
      animation-delay: 0s;
      mat-icon { color: var(--primary-500); }
    }

    .card-2 {
      bottom: 20%;
      left: 10%;
      animation-delay: 2s;
      mat-icon { color: var(--warning); }
    }

    .card-3 {
      bottom: 35%;
      right: 5%;
      animation-delay: 1s;
      mat-icon { color: #f59e0b; }
    }

    /* 3D Laptop */
    .laptop-3d {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) perspective(800px) rotateY(-8deg) rotateX(5deg);
      z-index: 1;
    }

    .laptop-screen {
      width: 280px;
      height: 190px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 12px 12px 0 0;
      border: 3px solid #334155;
      padding: 20px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 -5px 30px rgba(59, 130, 246, 0.15);
    }

    .screen-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .code-line {
      height: 8px;
      border-radius: 4px;
      animation: codeType 3s ease-in-out infinite;
    }

    .line-1 { width: 60%; background: #60a5fa; animation-delay: 0s; }
    .line-2 { width: 80%; background: #34d399; animation-delay: 0.3s; }
    .line-3 { width: 45%; background: #f472b6; animation-delay: 0.6s; }
    .line-4 { width: 70%; background: #a78bfa; animation-delay: 0.9s; }
    .line-5 { width: 55%; background: #fbbf24; animation-delay: 1.2s; }

    .screen-cursor {
      position: absolute;
      bottom: 25px;
      left: 20px;
      width: 8px;
      height: 16px;
      background: #60a5fa;
      border-radius: 2px;
      animation: blink 1s step-end infinite;
    }

    .laptop-base {
      width: 320px;
      height: 14px;
      background: linear-gradient(to bottom, #94a3b8, #64748b);
      border-radius: 0 0 8px 8px;
      margin: 0 auto;
      position: relative;
      left: -20px;
    }

    .laptop-shadow {
      width: 300px;
      height: 20px;
      background: radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%);
      margin: 8px auto 0;
      position: relative;
      left: -10px;
    }

    @keyframes codeType {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    /* Features Section */
    .features-section {
      padding: 100px 24px 60px;
      max-width: 1280px;
      margin: 0 auto;
      position: relative;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 32px;
    }

    .feature-card {
      padding: 32px 28px;
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      background: rgba(255, 255, 255, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);

      &:hover {
        transform: translateY(-12px);
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
        border-color: rgba(255, 255, 255, 1);
      }

      h3 {
        font-size: 1.3rem;
        font-weight: 700;
        margin: 24px 0 12px;
        color: var(--gray-900);
      }

      p {
        color: var(--gray-600);
        line-height: 1.6;
        margin: 0;
        font-size: 0.95rem;
      }
    }

    .feature-icon {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s;
      
      mat-icon {
        font-size: 34px;
        width: 34px;
        height: 34px;
      }
    }

    .feature-card:hover .feature-icon {
      transform: scale(1.1) rotate(-5deg);
    }

    .ai-icon { background: linear-gradient(135deg, #e0e7ff, #c7d2fe); color: #4f46e5; }
    .module-icon { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #16a34a; }
    .test-icon { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #d97706; }
    .chart-icon { background: linear-gradient(135deg, #ffe4e6, #fecdd3); color: #e11d48; }

    /* Modules Section */
    .modules-section {
      padding: 100px 24px;
      max-width: 1280px;
      margin: 0 auto;
    }

    .section-header {
      text-align: center;
      margin-bottom: 64px;

      h2 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 16px;
      }

      p {
        color: var(--gray-600);
        font-size: 1.1rem;
      }
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 32px;
    }

    .module-card {
      border-radius: 24px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: 1px solid rgba(255,255,255,0.8);

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      }
    }

    .card-image {
      height: 200px;
      background-size: cover;
      background-position: center;
      background-color: var(--gray-100);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .placeholder-icon {
      width: 64px;
      height: 64px;
      background: rgba(255,255,255,0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--gray-500);
      }
    }

    .card-content {
      padding: 24px;
    }

    .card-content h3 {
      font-size: 1.25rem;
      margin-bottom: 12px;
      font-weight: 700;
    }

    .card-content p {
      color: var(--gray-600);
      font-size: 0.95rem;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      color: var(--gray-500);
      font-size: 0.9rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .view-btn {
      width: 100%;
      border-radius: 12px !important;
    }

    /* About Section */
    .about-section {
      padding: 100px 24px;
      background: var(--white);
    }

    .about-container {
      max-width: 1000px;
      margin: 0 auto;
      border-radius: 32px;
      padding: 64px;
      display: flex;
      align-items: center;
      gap: 64px;
      background: linear-gradient(135deg, var(--gray-900) 0%, var(--gray-800) 100%);
      color: white;
    }

    .about-content {
      flex: 1;

      h2 {
        font-size: 2.5rem;
        margin-bottom: 24px;
        color: white;
      }

      .bio {
        color: var(--gray-200);
        margin-bottom: 32px;
        font-size: 1.1rem;
        line-height: 1.6;
      }
    }

    .skills-list {
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;

      li {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--gray-100);

        mat-icon {
          color: var(--success);
        }
      }
    }

    .about-image {
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-placeholder mat-icon {
      font-size: 120px;
      width: 120px;
      height: 120px;
      color: rgba(255,255,255,0.3);
    }

    /* Footer */
    .footer {
      background: var(--gray-50);
      padding: 80px 24px 24px;
      border-top: 1px solid var(--gray-200);
    }

    .footer-content {
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 64px;
      margin-bottom: 64px;
    }

    .footer-brand h3 {
      font-size: 1.5rem;
      margin-bottom: 16px;
    }

    .footer-brand p {
      color: var(--gray-500);
      max-width: 300px;
    }

    .footer-links, .footer-social {
      h4 {
        margin-bottom: 24px;
        color: var(--gray-900);
      }

      display: flex;
      flex-direction: column;
      gap: 12px;

      a {
        text-decoration: none;
        color: var(--gray-500);
        transition: color 0.2s;

        &:hover {
          color: var(--primary-600);
        }
      }
    }

    .social-icons {
      display: flex;
      gap: 16px;
      flex-direction: row;
    }

    .footer-bottom {
      text-align: center;
      padding-top: 32px;
      border-top: 1px solid var(--gray-200);
      color: var(--gray-400);
      font-size: 0.9rem;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }

    @media (max-width: 1024px) {
      .hero-section {
        flex-direction: column;
        padding-top: 100px;
        text-align: center;
      }

      .hero-content {
        max-width: 100%;
      }

      .hero-actions, .stats-row {
        justify-content: center;
      }

      .about-container {
        flex-direction: column;
        padding: 40px;
      }

      .footer-content {
        grid-template-columns: 1fr;
        gap: 40px;
      }

      .nav-links {
        display: none;
      }
    }
  `]
})
export class LandingComponent implements OnInit {
  router = inject(Router);
  moduleService = inject(ModuleService);
  studentService = inject(StudentService);
  private dialog = inject(MatDialog);

  modules = signal<Module[]>([]);
  isStudentLoggedIn = signal(false);

  ngOnInit() {
    this.isStudentLoggedIn.set(this.studentService.isStudentLoggedIn());

    this.moduleService.getAll(environment.teacherId).subscribe(mods => {
      this.modules.set(mods.slice(0, 6));
    });
  }

  scrollToModules() {
    document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
  }

  onBoshlash() {
    if (this.studentService.isStudentLoggedIn()) {
      this.router.navigate(['/student/modules']);
    } else {
      this.openAuthDialog();
    }
  }

  openAuthDialog() {
    this.dialog.open(StudentAuthComponent, {
      width: '480px',
      panelClass: 'student-auth-dialog'
    });
  }

  goToStudentModules() {
    this.router.navigate(['/student/modules']);
  }
}
