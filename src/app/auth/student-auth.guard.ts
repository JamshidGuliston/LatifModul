import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StudentService } from '../core/services/student.service';

export const studentAuthGuard: CanActivateFn = () => {
  const studentService = inject(StudentService);
  const router = inject(Router);

  if (studentService.isStudentLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/']);
};
