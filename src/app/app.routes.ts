import { Routes } from '@angular/router';
import { studentAuthGuard } from './auth/student-auth.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
    },
    {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'student/modules',
        loadComponent: () => import('./pages/student-modules/student-modules.component').then(m => m.StudentModulesComponent),
        canActivate: [studentAuthGuard]
    },
    {
        path: 'student/modules/:moduleId',
        loadComponent: () => import('./pages/student-module-detail/student-module-detail.component').then(m => m.StudentModuleDetailComponent),
        canActivate: [studentAuthGuard]
    },
    {
        path: 'student/modules/:moduleId/lessons/:lessonId',
        loadComponent: () => import('./pages/student-lesson-detail/student-lesson-detail.component').then(m => m.StudentLessonDetailComponent),
        canActivate: [studentAuthGuard]
    },
    {
        path: '',
        loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
        children: [
            { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'modules', loadChildren: () => import('./pages/modules/module.routes').then(m => m.MODULE_ROUTES) },
            { path: 'lessons', loadChildren: () => import('./pages/lessons/lesson.routes').then(m => m.LESSON_ROUTES) },
            { path: 'assignments', loadChildren: () => import('./pages/assignments/assignment.routes').then(m => m.ASSIGNMENT_ROUTES) },
            { path: 'students', loadChildren: () => import('./pages/students/student.routes').then(m => m.STUDENT_ROUTES) },
            { path: 'questions', loadChildren: () => import('./pages/questions/question.routes').then(m => m.QUESTION_ROUTES) },
        ]
    }
];
