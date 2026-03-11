import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./student-list/student-list.component').then(m => m.StudentListComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./student-form/student-form.component').then(m => m.StudentFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./student-form/student-form.component').then(m => m.StudentFormComponent)
    }
];
