import { Administrador, Alumno, Aviso, crearBloqueHorario, Inscripcion, Maestro, Materia, PeriodoEscolar } from '../dominio/entidades.js';
import type {
  NuevaInscripcion,
  NuevaMateria,
  NuevoAlumno,
  NuevoAviso,
  NuevoMaestro,
  RepositorioAcademico,
} from '../dominio/repositorio-academico.js';

export class RepositorioEnMemoria implements RepositorioAcademico {
  private administradores: Administrador[] = [
    { id: 1, nombre: 'Diana', correoInstitucional: 'diana@admin.com' },
  ];

  private maestros: Maestro[] = [
    { id: 1, numeroEmpleado: '12345', nombre: 'Ana', correoInstitucional: 'ana@gmail.com' },
    { id: 2, numeroEmpleado: '13243', nombre: 'Luis', correoInstitucional: 'luis@gmail.com' },
  ];

  private alumnos: Alumno[] = [
    { id: 1, matricula: '00001', nombre: 'Karla', correoInstitucional: 'karla@gmail.com' },
    { id: 2, matricula: '00002', nombre: 'Juan', correoInstitucional: 'juan@gmail.com' },
    { id: 3, matricula: '00003', nombre: 'Sofia', correoInstitucional: 'sofia@gmail.com' },
  ];

  private materias: Materia[] = [
    {
      id: 1, clave: 'PROGI07', nombre: 'Programacion I', descripcion: 'Introduccion a la programacion',
      creditos: 6, cupoMaximo: 2, maestroId: 1,
      horario: [crearBloqueHorario('lunes', '07:00', '08:30'), crearBloqueHorario('miercoles', '07:00', '08:30')],
    },
    {
      id: 2, clave: 'BADA07', nombre: 'Bases de Datos', descripcion: 'Modelado y SQL',
      creditos: 6, cupoMaximo: 3, maestroId: 2,
      horario: [crearBloqueHorario('lunes', '07:00', '08:30')],
    },
    {
      id: 3, clave: 'REDE10', nombre: 'Redes', descripcion: 'Fundamentos de redes',
      creditos: 5, cupoMaximo: 3, maestroId: 2,
      horario: [crearBloqueHorario('martes', '10:00', '11:30')],
    },
    {
      id: 4, clave: 'ESDA09', nombre: 'Estructuras de Datos', descripcion: 'Listas, pilas y colas',
      creditos: 6, cupoMaximo: 1, maestroId: 1,
      horario: [crearBloqueHorario('jueves', '09:00', '10:30')],
    },
  ];

  private periodos: PeriodoEscolar[] = [
    {
      id: 1,
      clave: '2026-2',
      fechaAperturaCarga: new Date(new Date().setDate(new Date().getDate() - 1)),
      fechaCierreCarga: new Date(new Date().setDate(new Date().getDate() + 30)),
      creditosMaximos: 20,
      habilitado: true,
    },
  ];

  private inscripciones: Inscripcion[] = [
    { id: 1, alumnoId: 1, materiaId: 1, periodoId: 1, fechaRegistro: new Date(), estadoActual: 'activa' },
    { id: 2, alumnoId: 2, materiaId: 4, periodoId: 1, fechaRegistro: new Date(), estadoActual: 'activa' },
  ];

  private avisos: Aviso[] = [];

  private siguienteIdAlumno = 4;
  private siguienteIdMaestro = 3;
  private siguienteIdMateria = 5;
  private siguienteIdInscripcion = 3;
  private siguienteIdAviso = 1;

  async buscarAlumnoPorId(id: number): Promise<Alumno | null> {
    return this.alumnos.find((a) => a.id === id) ?? null;
  }

  async buscarAlumnoPorMatricula(matricula: string): Promise<Alumno | null> {
    return this.alumnos.find((a) => a.matricula === matricula) ?? null;
  }

  async buscarMaestroPorId(id: number): Promise<Maestro | null> {
    return this.maestros.find((m) => m.id === id) ?? null;
  }

  async buscarMaestroPorNumeroEmpleado(numeroEmpleado: string): Promise<Maestro | null> {
    return this.maestros.find((m) => m.numeroEmpleado === numeroEmpleado) ?? null;
  }

  async buscarAdministradorPorId(id: number): Promise<Administrador | null> {
    return this.administradores.find((a) => a.id === id) ?? null;
  }

  async buscarMateriaPorId(id: number): Promise<Materia | null> {
    return this.materias.find((m) => m.id === id) ?? null;
  }

  async buscarPeriodoPorId(id: number): Promise<PeriodoEscolar | null> {
    return this.periodos.find((p) => p.id === id) ?? null;
  }

  async buscarPeriodoConCargaAbierta(): Promise<PeriodoEscolar | null> {
    return this.periodos.find((p) => p.habilitado) ?? null;
  }

  async contarInscripcionesActivasDeMateria(materiaId: number, periodoId: number): Promise<number> {
    return this.inscripciones.filter(
      (i) => i.materiaId === materiaId && i.periodoId === periodoId && i.estadoActual === 'activa',
    ).length;
  }

  async listarInscripcionesDeAlumnoEnPeriodo(alumnoId: number, periodoId: number): Promise<Inscripcion[]> {
    return this.inscripciones.filter((i) => i.alumnoId === alumnoId && i.periodoId === periodoId);
  }

  async listarInscripcionesDeAlumno(alumnoId: number): Promise<Inscripcion[]> {
    return this.inscripciones.filter((i) => i.alumnoId === alumnoId);
  }

  async listarAvisosDePeriodo(periodoId: number): Promise<Aviso[]> {
    return this.avisos.filter((a) => a.periodoId === periodoId);
  }

  async crearAlumno(datos: NuevoAlumno): Promise<Alumno> {
    const nuevo: Alumno = { id: this.siguienteIdAlumno++, ...datos };
    this.alumnos.push(nuevo);
    return nuevo;
  }

  async crearMaestro(datos: NuevoMaestro): Promise<Maestro> {
    const nuevo: Maestro = { id: this.siguienteIdMaestro++, ...datos };
    this.maestros.push(nuevo);
    return nuevo;
  }

  async crearMateria(datos: NuevaMateria): Promise<Materia> {
    const nueva: Materia = { id: this.siguienteIdMateria++, ...datos };
    this.materias.push(nueva);
    return nueva;
  }

  async crearInscripcion(datos: NuevaInscripcion): Promise<Inscripcion> {
    const nueva: Inscripcion = { id: this.siguienteIdInscripcion++, ...datos };
    this.inscripciones.push(nueva);
    return nueva;
  }

  async crearAviso(datos: NuevoAviso): Promise<Aviso> {
    const nuevo: Aviso = { id: this.siguienteIdAviso++, ...datos };
    this.avisos.push(nuevo);
    return nuevo;
  }

  async actualizarInscripcion(inscripcion: Inscripcion): Promise<void> {
    const indice = this.inscripciones.findIndex((i) => i.id === inscripcion.id);
    if (indice !== -1) this.inscripciones[indice] = inscripcion;
  }

  async actualizarPeriodo(periodo: PeriodoEscolar): Promise<void> {
    const indice = this.periodos.findIndex((p) => p.id === periodo.id);
    if (indice !== -1) this.periodos[indice] = periodo;
  }
}
