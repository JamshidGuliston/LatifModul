
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
        <div class="hero-bg">
          <div class="glow-orb primary-orb"></div>
          <div class="glow-orb secondary-orb"></div>
          <div class="grid-overlay"></div>
        </div>
        <div class="hero-content">
          <div class="tech-badge animate-fade-in">
            <span class="pulse-dot"></span> {{ 'landing.heroHighlight' | translate }}
          </div>
          <h1 class="hero-title animate-slide-up">
            <span class="highlight text-gradient">{{ 'landing.heroHighlight' | translate }}</span><br/>
            {{ 'landing.heroTitle' | translate }}
          </h1>
          <p class="hero-subtitle animate-slide-up-delay">
            {{ 'landing.heroSubtitle' | translate }}
          </p>
          <div class="hero-actions animate-slide-up-delay-2">
            <button mat-flat-button color="primary" class="cta-btn primary-glow" (click)="onBoshlash()">
              <span class="btn-text">{{ 'landing.start' | translate }}</span>
              <mat-icon>arrow_forward</mat-icon>
            </button>
            <button mat-stroked-button class="secondary-btn" (click)="scrollToModules()">
              <mat-icon>play_circle_outline</mat-icon>
              <span class="btn-text">{{ 'landing.viewCourses' | translate }}</span>
            </button>
          </div>
          <div class="stats-row animate-slide-up-delay-3">
            <div class="stat-item glass-panel">
              <span class="stat-value">{{ modules().length }}+</span>
              <span class="stat-label">{{ 'landing.statModules' | translate }}</span>
            </div>
            <div class="stat-item glass-panel">
              <span class="stat-value">500+</span>
              <span class="stat-label">{{ 'landing.statStudents' | translate }}</span>
            </div>
            <div class="stat-item glass-panel">
              <span class="stat-value rating-val">4.9 <mat-icon class="star-icon" style="font-size: 1.5rem; width: 1.5rem; height: 1.5rem;">star</mat-icon></span>
              <span class="stat-label">{{ 'landing.statRating' | translate }}</span>
            </div>
          </div>
        </div>
        <div class="hero-visual animate-float-slow">
           <div class="scene-container">
             <div class="center-nucleus">
               <div class="nucleus-core"><mat-icon>school</mat-icon></div>
               <div class="orbit orbit-1"></div>
               <div class="orbit orbit-2"></div>
               <div class="orbit orbit-3"></div>
               
               <div class="planet planet-1 glass">
                 <mat-icon>code</mat-icon>
                 <span>Code</span>
               </div>
               
               <div class="planet planet-2 glass">
                 <mat-icon>smart_toy</mat-icon>
                 <span>AI</span>
               </div>
               
               <div class="planet planet-3 glass">
                 <mat-icon>psychology</mat-icon>
                 <span>Logic</span>
               </div>
             </div>
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

      <!-- Workflow & Rules Section -->
      <section id="workflow" class="workflow-section">
        <div class="section-header">
          <h2>{{ 'landing.workflowTitle' | translate }}</h2>
          <p>{{ 'landing.workflowDesc' | translate }}</p>
        </div>
        
        <div class="workflow-container">
          <div class="steps-wrapper">
            <div class="step-card glass">
              <div class="step-number">01</div>
              <div class="step-icon">
                <mat-icon>menu_book</mat-icon>
              </div>
              <h3 class="step-title">{{ 'landing.step1Title' | translate }}</h3>
              <p class="step-desc">{{ 'landing.step1Desc' | translate }}</p>
            </div>
            <div class="step-connector">
              <mat-icon>keyboard_arrow_right</mat-icon>
            </div>
            <div class="step-card glass">
              <div class="step-number">02</div>
              <div class="step-icon">
                <mat-icon>play_circle_filled</mat-icon>
              </div>
              <h3 class="step-title">{{ 'landing.step2Title' | translate }}</h3>
              <p class="step-desc">{{ 'landing.step2Desc' | translate }}</p>
            </div>
            <div class="step-connector">
              <mat-icon>keyboard_arrow_right</mat-icon>
            </div>
            <div class="step-card glass">
              <div class="step-number">03</div>
              <div class="step-icon">
                <mat-icon>assignment</mat-icon>
              </div>
              <h3 class="step-title">{{ 'landing.step3Title' | translate }}</h3>
              <p class="step-desc">{{ 'landing.step3Desc' | translate }}</p>
            </div>
            <div class="step-connector">
              <mat-icon>keyboard_arrow_right</mat-icon>
            </div>
            <div class="step-card glass">
              <div class="step-number">04</div>
              <div class="step-icon">
                <mat-icon>emoji_events</mat-icon>
              </div>
              <h3 class="step-title">{{ 'landing.step4Title' | translate }}</h3>
              <p class="step-desc">{{ 'landing.step4Desc' | translate }}</p>
            </div>
          </div>

          <div class="rules-card glass">
            <div class="rules-left">
              <div class="rules-icon-bg">
                <mat-icon>gavel</mat-icon>
              </div>
              <div>
                <h3>{{ 'landing.rulesTitle' | translate }}</h3>
                <p>{{ 'landing.rulesDesc' | translate }}</p>
              </div>
            </div>
            <div class="rules-right">
              <div class="rule-item">
                <mat-icon class="check-icon">verified</mat-icon>
                <span>{{ 'landing.rule1' | translate }}</span>
              </div>
              <div class="rule-item">
                <mat-icon class="check-icon">verified</mat-icon>
                <span>{{ 'landing.rule2' | translate }}</span>
              </div>
              <div class="rule-item">
                <mat-icon class="check-icon">verified</mat-icon>
                <span>{{ 'landing.rule3' | translate }}</span>
              </div>
              <div class="rule-item">
                <mat-icon class="check-icon">verified</mat-icon>
                <span>{{ 'landing.rule4' | translate }}</span>
              </div>
            </div>
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
      position: relative;
    }

    .hero-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      overflow: hidden;
      z-index: -1;
    }

    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.5;
      animation: float-slow 8s infinite alternate ease-in-out;
    }

    .primary-orb {
      width: 400px;
      height: 400px;
      background: rgba(37, 99, 235, 0.4);
      top: -100px;
      right: -100px;
    }

    .secondary-orb {
      width: 500px;
      height: 500px;
      background: rgba(139, 92, 246, 0.4);
      bottom: -150px;
      left: -150px;
      animation-delay: -4s;
    }

    .grid-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-size: 40px 40px;
      background-image: linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
    }

    .hero-content {
      flex: 1.2;
      max-width: 650px;
      position: relative;
      z-index: 10;
    }

    .tech-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(37, 99, 235, 0.2);
      border-radius: 100px;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-700);
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      backdrop-filter: blur(8px);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--primary-500);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
      animation: pulse-ring 2s infinite;
    }

    .hero-title {
      font-size: 4.5rem;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 24px;
      letter-spacing: -1.5px;
      color: var(--gray-900);
    }

    .text-gradient {
      background: linear-gradient(135deg, #2563eb, #7c3aed, #db2777);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-size: 200% auto;
      animation: textGlow 4s linear infinite;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--gray-600);
      margin-bottom: 40px;
      line-height: 1.6;
      max-width: 550px;
    }

    .hero-actions {
      display: flex;
      gap: 20px;
      margin-bottom: 48px;
      align-items: center;
    }

    ::ng-deep .cta-btn.primary-glow {
      padding: 28px 44px !important;
      font-size: 1.15rem !important;
      border-radius: 100px !important;
      font-weight: 700 !important;
      background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4), inset 0 2px 0 rgba(255,255,255,0.2) !important;
      color: white !important;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    }

    ::ng-deep .cta-btn.primary-glow:hover {
      transform: translateY(-4px) scale(1.02) !important;
      box-shadow: 0 15px 35px rgba(37, 99, 235, 0.5), inset 0 2px 0 rgba(255,255,255,0.2) !important;
    }

    ::ng-deep .secondary-btn {
      padding: 28px 36px !important;
      font-size: 1.1rem !important;
      border-radius: 100px !important;
      border: 2px solid rgba(37, 99, 235, 0.2) !important;
      background: rgba(255, 255, 255, 0.5) !important;
      color: var(--gray-800) !important;
      font-weight: 600 !important;
      backdrop-filter: blur(4px) !important;
      transition: all 0.3s !important;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    ::ng-deep .secondary-btn:hover {
      background: white !important;
      border-color: var(--primary-500) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
    }

    .btn-text {
      display: inline-block;
    }

    .stats-row {
      display: flex;
      gap: 24px;
      padding-top: 32px;
      border-top: 1px solid rgba(0,0,0,0.05);
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      padding: 16px 24px;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.03);
      transition: transform 0.3s ease;
    }

    .glass-panel:hover {
      transform: translateY(-4px);
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--gray-900);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .rating-val { color: #f59e0b; }

    .stat-label {
      font-size: 0.9rem;
      color: var(--gray-500);
      font-weight: 500;
      margin-top: 4px;
    }

    /* Hero Visual */
    .hero-visual {
      flex: 1;
      height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1000px;
    }

    .scene-container {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-style: preserve-3d;
      animation: wobble-slow 16s ease-in-out infinite;
    }

    .center-nucleus {
      position: relative;
      width: 120px;
      height: 120px;
      transform-style: preserve-3d;
    }

    .nucleus-core {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 40px rgba(99, 102, 241, 0.6), inset 0 0 20px rgba(255,255,255,0.5);
      z-index: 10;
      color: white;
      
      mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
      }
    }

    .orbit {
      position: absolute;
      top: 50%; left: 50%;
      border: 1px dashed rgba(37, 99, 235, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%) rotateX(60deg);
      transform-style: preserve-3d;
      pointer-events: none;
    }

    .orbit-1 { width: 250px; height: 250px; animation: spin-forward 10s linear infinite; }
    .orbit-2 { width: 380px; height: 380px; animation: spin-backward 15s linear infinite; border-color: rgba(139, 92, 246, 0.3); }
    .orbit-3 { width: 500px; height: 500px; animation: spin-forward 25s linear infinite; border-color: rgba(236, 72, 153, 0.2); }

    .planet {
      position: absolute;
      padding: 12px 24px;
      border-radius: 100px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--gray-800);
      box-shadow: 0 10px 30px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
      border: 1px solid rgba(255, 255, 255, 0.4);
      transform-style: preserve-3d;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      white-space: nowrap;
    }

    .planet-1 { 
      top: -10%; left: 60%; 
      transform: translate(-50%, -50%); 
      background: rgba(255, 255, 255, 0.85);
      color: #2563eb;
      animation: float-planet 6s ease-in-out infinite alternate;
    }
    
    .planet-2 { 
      bottom: -15%; right: -20%; 
      transform: translate(50%, 50%); 
      background: rgba(255, 255, 255, 0.85);
      color: #7c3aed;
      animation: float-planet 7s ease-in-out infinite alternate-reverse;
    }
    
    .planet-3 { 
      top: 40%; left: -40%; 
      transform: translate(-50%, -50%); 
      background: rgba(255, 255, 255, 0.85);
      color: #db2777;
      animation: float-planet 8s ease-in-out infinite alternate;
    }

    /* Animations */
    @keyframes float-slow {
      0% { transform: translateY(0) scale(1); }
      100% { transform: translateY(-30px) scale(1.05); }
    }
    
    @keyframes pulse-ring {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
    }

    @keyframes textGlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes wobble-slow {
      0% { transform: rotateY(-15deg) rotateX(5deg); }
      50% { transform: rotateY(15deg) rotateX(-5deg); }
      100% { transform: rotateY(-15deg) rotateX(5deg); }
    }

    @keyframes float-planet {
      0% { transform: translate(-50%, -50%) translateY(0px) scale(1); }
      100% { transform: translate(-50%, -50%) translateY(-20px) scale(1.05); }
    }

    @keyframes spin-forward {
      from { transform: translate(-50%, -50%) rotateX(60deg) rotateZ(0deg); }
      to { transform: translate(-50%, -50%) rotateX(60deg) rotateZ(360deg); }
    }

    @keyframes spin-backward {
      from { transform: translate(-50%, -50%) rotateX(60deg) rotateZ(360deg); }
      to { transform: translate(-50%, -50%) rotateX(60deg) rotateZ(0deg); }
    }

    .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
    .animate-slide-up { animation: slideUp 0.8s ease-out forwards; opacity: 0; transform: translateY(30px); }
    .animate-slide-up-delay { animation: slideUp 0.8s ease-out 0.2s forwards; opacity: 0; transform: translateY(30px); }
    .animate-slide-up-delay-2 { animation: slideUp 0.8s ease-out 0.4s forwards; opacity: 0; transform: translateY(30px); }
    .animate-slide-up-delay-3 { animation: slideUp 0.8s ease-out 0.6s forwards; opacity: 0; transform: translateY(30px); }
    .animate-float-slow { animation: float-slow 4s ease-in-out infinite alternate; }

    @keyframes fadeIn { to { opacity: 1; } }
    @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

    /* Workflow & Rules Section */
    .workflow-section {
      padding: 100px 24px;
      max-width: 1280px;
      margin: 0 auto;
      position: relative;
    }

    .workflow-container {
      display: flex;
      flex-direction: column;
      gap: 64px;
    }

    .steps-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      position: relative;
    }

    .step-card {
      flex: 1;
      padding: 32px 24px;
      border-radius: 24px;
      text-align: center;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.3s;
      z-index: 2;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.9);
    }
    
    .step-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.06);
      background: white;
    }

    .step-number {
      position: absolute;
      top: -15px;
      left: 20px;
      font-size: 3rem;
      font-weight: 900;
      color: rgba(37, 99, 235, 0.1);
      line-height: 1;
    }

    .step-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 8px 16px rgba(37, 99, 235, 0.1);
      
      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
    }

    .step-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 12px;
    }

    .step-desc {
      font-size: 0.95rem;
      color: var(--gray-600);
      line-height: 1.5;
      margin: 0;
    }

    .step-connector {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 140px;
      color: var(--gray-300);
      
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    }

    .rules-card {
      display: flex;
      background: white;
      border-radius: 32px;
      padding: 48px;
      gap: 48px;
      align-items: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.03);
    }

    .rules-left {
      flex: 1;
      display: flex;
      gap: 24px;
      
      h3 {
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 8px;
        color: var(--gray-900);
      }
      
      p {
        color: var(--gray-600);
        font-size: 1.1rem;
        line-height: 1.6;
      }
    }

    .rules-icon-bg {
      width: 80px;
      height: 80px;
      border-radius: 24px;
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    }

    .rules-right {
      flex: 1.5;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .rule-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      border-radius: 16px;
      background: var(--gray-50);
      border: 1px solid var(--gray-100);
      transition: all 0.2s;
      
      &:hover {
        background: white;
        box-shadow: 0 10px 20px rgba(0,0,0,0.02);
        border-color: var(--primary-100);
        transform: translateY(-2px);
      }
      
      span {
        font-weight: 600;
        color: var(--gray-800);
        line-height: 1.4;
      }
    }

    .check-icon {
      color: var(--success);
      flex-shrink: 0;
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
