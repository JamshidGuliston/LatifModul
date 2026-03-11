import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MatSidenavModule, ToolbarComponent, SidebarComponent],
  template: `
    <div class="layout-container">
      <app-toolbar (toggleSidenav)="sidenavOpened.set(!sidenavOpened())" />
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav [opened]="sidenavOpened()" mode="side" class="sidenav">
          <app-sidebar />
        </mat-sidenav>
        <mat-sidenav-content class="content">
          <div class="page-content">
            <router-outlet />
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--white);
    }

    .sidenav-container {
      flex: 1;
      background: transparent;
    }

    .sidenav {
      width: 260px;
      background: var(--white);
      border-right: 1px solid var(--gray-100);
      box-shadow: var(--shadow-sm);
    }

    .content {
      background: linear-gradient(135deg, var(--gray-50) 0%, var(--white) 100%);
      position: relative;
      overflow-x: hidden;
    }

    .content::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 50%;
      height: 50%;
      background: radial-gradient(circle at top right, var(--primary-50) 0%, transparent 60%);
      pointer-events: none;
      opacity: 0.7;
    }

    .page-content {
      padding: 32px;
      min-height: 100%;
      position: relative;
      z-index: 1;
      animation: fadeIn 0.4s ease-out;
    }

    @media (max-width: 768px) {
      .sidenav {
        width: 240px;
      }
      .page-content {
        padding: 16px;
      }
    }
  `]
})
export class LayoutComponent {
  sidenavOpened = signal(true);
}
