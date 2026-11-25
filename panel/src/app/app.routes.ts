import { Routes } from '@angular/router';
import { Login } from './paginas/login/login';
import { Panel } from './paginas/panel/panel';
import { NoEncontrado } from './paginas/no-encontrado';
import { soloAdmin } from './sesion/solo-admin';
import { RUTAS_TABLERO } from './paginas/tablero/rutas';
import { RUTAS_MATERIAS } from './paginas/materias/rutas';
import { RUTAS_PERSONAS } from './paginas/personas/rutas';
import { RUTAS_PERIODOS } from './paginas/periodos/rutas';

// Cada parte del equipo llena el rutas.ts de su carpeta; este archivo ya no se toca.
export const routes: Routes = [
  { path: 'login', component: Login, title: 'Entrar - Admin' },
  {
    path: '',
    component: Panel,
    canActivate: [soloAdmin],
    children: [
      ...RUTAS_TABLERO,
      ...RUTAS_MATERIAS,
      ...RUTAS_PERSONAS,
      ...RUTAS_PERIODOS,
      { path: '', redirectTo: 'tablero', pathMatch: 'full' },
      // Va dentro del panel a propósito: sin sesión, cualquier dirección manda al login.
      { path: '**', component: NoEncontrado, title: 'No encontrado - Admin' },
    ],
  },
];
