import { Routes } from '@angular/router';
import { cambiosSinGuardar } from '../cambios-sin-guardar';
import { PaginaPeriodos } from './pagina-periodos';
import { FormularioPeriodo } from './formulario-periodo';
import { DetallePeriodo } from './detalle-periodo';
import { PaginaGrupos } from '../grupos/pagina-grupos';
import { FormularioGrupo } from '../grupos/formulario-grupo';
import { DetalleGrupo } from '../grupos/detalle-grupo';

// Jesús: períodos y grupos.
// 'nuevo' va antes que ':id' para que "nuevo" no se tome como un id.
export const RUTAS_PERIODOS: Routes = [
  { path: 'periodos', component: PaginaPeriodos, title: 'Períodos - Admin' },
  { path: 'periodos/nuevo', component: FormularioPeriodo, canDeactivate: [cambiosSinGuardar], title: 'Nuevo período - Admin' },
  { path: 'periodos/:id', component: DetallePeriodo, title: 'Período - Admin' },
  { path: 'periodos/:id/editar', component: FormularioPeriodo, canDeactivate: [cambiosSinGuardar], title: 'Editar período - Admin' },

  { path: 'grupos', component: PaginaGrupos, title: 'Grupos - Admin' },
  { path: 'grupos/nuevo', component: FormularioGrupo, canDeactivate: [cambiosSinGuardar], title: 'Nuevo grupo - Admin' },
  { path: 'grupos/:id', component: DetalleGrupo, title: 'Grupo - Admin' },
];
