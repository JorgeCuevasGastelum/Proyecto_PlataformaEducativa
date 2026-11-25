import { Routes } from '@angular/router';
import { cambiosSinGuardar } from '../cambios-sin-guardar';
import { Tablero } from './tablero';
import { PaginaPagos } from '../pagos/pagina-pagos';
import { FormularioCargo } from '../pagos/formulario-cargo';
import { PaginaAvisos } from '../avisos/pagina-avisos';
import { FormularioAviso } from '../avisos/formulario-aviso';

// Katia: tablero, pagos y avisos
export const RUTAS_TABLERO: Routes = [
  { path: 'tablero', component: Tablero, title: 'Tablero - Admin' },

  { path: 'pagos', component: PaginaPagos, title: 'Pagos - Admin' },
  { path: 'pagos/nuevo', component: FormularioCargo, canDeactivate: [cambiosSinGuardar], title: 'Registrar cargo - Admin' },

  { path: 'avisos', component: PaginaAvisos, title: 'Avisos - Admin' },
  { path: 'avisos/nuevo', component: FormularioAviso, canDeactivate: [cambiosSinGuardar], title: 'Nuevo aviso - Admin' },
  { path: 'avisos/:id/editar', component: FormularioAviso, canDeactivate: [cambiosSinGuardar], title: 'Editar aviso - Admin' },
];
