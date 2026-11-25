// Los dos interceptores de gimnasio-admin: uno pone el token en cada petición
// y el otro cierra la sesión cuando el servicio responde 401.

import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Sesion } from './sesion';

export const conToken: HttpInterceptorFn = (req, next) => {
  const token = inject(Sesion).token();
  if (!token) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

// El 401 del propio login no cuenta: ése es "contraseña equivocada", no "sesión vencida".
export const alFallar: HttpInterceptorFn = (req, next) => {
  const sesion = inject(Sesion);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const esLogin = req.url.includes('/auth/login');
      if (error instanceof HttpErrorResponse && error.status === 401 && !esLogin) {
        sesion.salir();
        router.navigate(['/login'], { queryParams: { motivo: 'vencio' } });
      }
      return throwError(() => error);
    }),
  );
};
