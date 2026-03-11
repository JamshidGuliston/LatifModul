import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TeacherService } from '../core/services/teacher.service';

export const authGuard: CanActivateFn = () => {
  const teacherService = inject(TeacherService);
  const router = inject(Router);

  if (teacherService.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
