import { Routes } from '@angular/router';

export const MODULE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./module-list/module-list.component').then(m => m.ModuleListComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./module-form/module-form.component').then(m => m.ModuleFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./module-form/module-form.component').then(m => m.ModuleFormComponent)
    },
    {
        path: ':id/lessons',
        loadChildren: () => import('../lessons/lesson.routes').then(m => m.LESSON_ROUTES)
    }
];
