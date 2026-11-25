import { Routes } from '@angular/router';
import { cambiosSinGuardar } from '../cambios-sin-guardar';
import { PaginaMaterias } from './pagina-materias';
import { FormularioMateria } from './formulario-materia';
import { DetalleMateria } from './detalle-materia';
import { PaginaPlanes } from './pagina-planes';

// Jorge: materias, carreras y planes.
// 'materias/nueva' va antes que 'materias/:id' para que "nueva" no se tome como un id.
export const RUTAS_MATERIAS: Routes = [
  { path: 'materias', component: PaginaMaterias, title: 'Materias - Admin' },
  { path: 'materias/nueva', component: FormularioMateria, canDeactivate: [cambiosSinGuardar], title: 'Nueva materia - Admin' },
  { path: 'materias/:id', component: DetalleMateria, title: 'Materia - Admin' },
  { path: 'materias/:id/editar', component: FormularioMateria, canDeactivate: [cambiosSinGuardar], title: 'Editar materia - Admin' },

  { path: 'planes', component: PaginaPlanes, canDeactivate: [cambiosSinGuardar], title: 'Carreras y planes - Admin' },
];
