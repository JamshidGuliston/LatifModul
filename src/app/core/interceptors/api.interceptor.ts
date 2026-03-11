import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  let apiReq = req;

  // 1. Base URL qo'shish
  if (req.url.startsWith('/')) {
    apiReq = apiReq.clone({ url: `${environment.apiUrl}${req.url}` });
  }

  // 2. Authorization token qo'shish
  const teacherData = localStorage.getItem('teacher');
  if (teacherData) {
    const teacher = JSON.parse(teacherData);
    const token = teacher?.api_token;
    if (token) {
      apiReq = apiReq.clone({
        headers: apiReq.headers.set('Authorization', `Token ${token}`)
      });
    }
  }

  return next(apiReq);
};
