import { Routes } from '@angular/router';

export const QUESTION_ROUTES: Routes = [
    {
        path: 'new',
        loadComponent: () => import('./question-form/question-form.component').then(m => m.QuestionFormComponent)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./question-form/question-form.component').then(m => m.QuestionFormComponent)
    }
];
