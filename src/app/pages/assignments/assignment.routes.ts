import { Routes } from '@angular/router';

export const ASSIGNMENT_ROUTES: Routes = [
    {
        path: 'new',
        loadComponent: () => import('./assignment-form/assignment-form.component').then(m => m.AssignmentFormComponent)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./assignment-form/assignment-form.component').then(m => m.AssignmentFormComponent)
    },
    {
        path: ':id/questions',
        loadComponent: () => import('../questions/question-list/question-list.component').then(m => m.QuestionListComponent)
    }
];
