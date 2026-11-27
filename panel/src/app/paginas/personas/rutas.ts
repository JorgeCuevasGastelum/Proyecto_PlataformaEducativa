import { Routes } from '@angular/router';
import { cambiosSinGuardar } from '../cambios-sin-guardar';
import { DetalleAlumno } from './detalle-alumno';
import { DetalleMaestro } from './detalle-maestro';
import { FormularioAlumno } from './formulario-alumno';
import { FormularioMaestro } from './formulario-maestro';
import { PaginaAlumnos } from './pagina-alumnos';
import { PaginaMaestros } from './pagina-maestros';

export const RUTAS_PERSONAS: Routes = [
  { path: 'alumnos', component: PaginaAlumnos, title: 'Alumnos - Admin' },
  { path: 'alumnos/nuevo', component: FormularioAlumno, canDeactivate: [cambiosSinGuardar], title: 'Nuevo alumno - Admin' },
  { path: 'alumnos/:id/editar', component: FormularioAlumno, canDeactivate: [cambiosSinGuardar], title: 'Editar alumno - Admin' },
  { path: 'alumnos/:id', component: DetalleAlumno, title: 'Alumno - Admin' },

  { path: 'maestros', component: PaginaMaestros, title: 'Maestros - Admin' },
  { path: 'maestros/nuevo', component: FormularioMaestro, canDeactivate: [cambiosSinGuardar], title: 'Nuevo maestro - Admin' },
  { path: 'maestros/:id/editar', component: FormularioMaestro, canDeactivate: [cambiosSinGuardar], title: 'Editar maestro - Admin' },
  { path: 'maestros/:id', component: DetalleMaestro, title: 'Maestro - Admin' },
];
