// El guardia del panel. Esconder no es seguridad: lo que protege de verdad es
// el @Roles('administrador') del servicio, que responde 403.

import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { Sesion } from './sesion';

export const soloAdmin: CanActivateFn = () => {
  const sesion = inject(Sesion);
  if (sesion.esAdmin()) return true;
  return inject(Router).createUrlTree(['/login']);
};
