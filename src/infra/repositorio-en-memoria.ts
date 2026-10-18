import { crearBloqueHorario } from '../dominio/entidades.js';
import type {
  Administrador,
  Alumno,
  Aviso,
  Carrera,
  Grupo,
  Inscripcion,
  Maestro,
  Materia,
  Pago,
  PeriodoEscolar,
  PlanDeEstudios,
  Usuario,
} from '../dominio/entidades.js';
import type {
  NuevaInscripcion,
  NuevaMateria,
  NuevoAlumno,
  NuevoAviso,
  NuevoGrupo,
  NuevoMaestro,
  NuevoPago,
  NuevoPeriodo,
  NuevoUsuario,
  RepositorioAcademico,
} from '../dominio/repositorio-academico.js';
import { generarHashSincrono } from './hash-scrypt.js';

// Contraseña de todas las cuentas de prueba.
export const CONTRASENA_DE_PRUEBA = 'Potros2026';

function diasDesdeHoy(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

function siguienteId(lista: { id: number }[]): number {
  return lista.reduce((maximo, elemento) => Math.max(maximo, elemento.id), 0) + 1;
}

export class RepositorioEnMemoria implements RepositorioAcademico {
  private administradores: Administrador[] = [{ id: 1, nombre: 'Diana' }];

  private maestros: Maestro[] = [
    { id: 1, numeroEmpleado: '12345', nombre: 'Ana' },
    { id: 2, numeroEmpleado: '13243', nombre: 'Luis' },
  ];

  private alumnos: Alumno[] = [
    { id: 1, matricula: '00001', nombre: 'Karla', planDeEstudiosId: 1 },
    { id: 2, matricula: '00002', nombre: 'Juan', planDeEstudiosId: 1 },
    { id: 3, matricula: '00003', nombre: 'Sofia', planDeEstudiosId: 1 },
    { id: 4, matricula: '00004', nombre: 'Pedro', planDeEstudiosId: 2 },
    { id: 5, matricula: '00005', nombre: 'Mario', planDeEstudiosId: 1 },
  ];

  private usuarios: Usuario[] = [
    this.usuario(1, 'diana@admin.edu.mx', 'administrador', 1),
    this.usuario(2, 'ana@maestros.edu.mx', 'maestro', 1),
    this.usuario(3, 'luis@maestros.edu.mx', 'maestro', 2),
    this.usuario(4, 'karla@alumnos.edu.mx', 'alumno', 1),
    this.usuario(5, 'juan@alumnos.edu.mx', 'alumno', 2),
    this.usuario(6, 'sofia@alumnos.edu.mx', 'alumno', 3),
    this.usuario(7, 'pedro@alumnos.edu.mx', 'alumno', 4),
    this.usuario(8, 'mario@alumnos.edu.mx', 'alumno', 5),
  ];

  private carreras: Carrera[] = [
    { id: 1, clave: 'ISW', nombre: 'Ingeniería en Software' },
    { id: 2, clave: 'IIS', nombre: 'Ingeniería Industrial y de Sistemas' },
  ];

  private materias: Materia[] = [
    { id: 1, clave: 'PROG1', nombre: 'Programacion I', descripcion: 'Introduccion a la programacion', creditos: 6, prerrequisitoIds: [] },
    { id: 2, clave: 'PROG2', nombre: 'Programacion II', descripcion: 'Programacion orientada a objetos', creditos: 6, prerrequisitoIds: [1] },
    { id: 3, clave: 'BADA', nombre: 'Bases de Datos', descripcion: 'Modelado y SQL', creditos: 6, prerrequisitoIds: [] },
    { id: 4, clave: 'REDE', nombre: 'Redes', descripcion: 'Fundamentos de redes', creditos: 5, prerrequisitoIds: [] },
    { id: 5, clave: 'ESDA', nombre: 'Estructuras de Datos', descripcion: 'Listas, pilas y colas', creditos: 6, prerrequisitoIds: [1] },
    { id: 6, clave: 'ING1', nombre: 'Ingles I', descripcion: 'Ingles basico', creditos: 4, prerrequisitoIds: [] },
    { id: 7, clave: 'ESTA', nombre: 'Estadistica', descripcion: 'Probabilidad y estadistica', creditos: 5, prerrequisitoIds: [] },
  ];

  // Inglés I (6) está en los dos planes: es una materia común entre carreras.
  private planes: PlanDeEstudios[] = [
    { id: 1, clave: 'ISW-2020', carreraId: 1, materiaIds: [1, 2, 3, 4, 5, 6] },
    { id: 2, clave: 'IIS-2020', carreraId: 2, materiaIds: [6, 7] },
  ];

  private periodos: PeriodoEscolar[] = [
    {
      id: 1,
      clave: '2026-1',
      fechaAperturaCarga: diasDesdeHoy(-180),
      fechaCierreCarga: diasDesdeHoy(-150),
      creditosMaximos: 20,
      habilitado: false,
    },
    {
      id: 2,
      clave: '2026-2',
      fechaAperturaCarga: diasDesdeHoy(-1),
      fechaCierreCarga: diasDesdeHoy(30),
      creditosMaximos: 20,
      habilitado: true,
    },
  ];

  private grupos: Grupo[] = [
    // Periodo 2026-1 (ya cerrado)
    {
      id: 1, materiaId: 1, periodoId: 1, clave: '01', maestroId: 1, cupoMaximo: 30,
      horario: [crearBloqueHorario('lunes', '07:00', '08:30'), crearBloqueHorario('miercoles', '07:00', '08:30')],
    },
    {
      id: 2, materiaId: 1, periodoId: 1, clave: '02', maestroId: 2, cupoMaximo: 30,
      horario: [crearBloqueHorario('martes', '07:00', '08:30'), crearBloqueHorario('jueves', '07:00', '08:30')],
    },
    // Periodo 2026-2 (carga abierta)
    {
      id: 3, materiaId: 2, periodoId: 2, clave: '01', maestroId: 1, cupoMaximo: 30,
      horario: [crearBloqueHorario('lunes', '07:00', '08:30'), crearBloqueHorario('miercoles', '07:00', '08:30')],
    },
    {
      id: 4, materiaId: 3, periodoId: 2, clave: '01', maestroId: 2, cupoMaximo: 3,
      horario: [crearBloqueHorario('lunes', '07:00', '08:30')],
    },
    {
      id: 5, materiaId: 4, periodoId: 2, clave: '01', maestroId: 2, cupoMaximo: 3,
      horario: [crearBloqueHorario('martes', '10:00', '11:30')],
    },
    {
      id: 6, materiaId: 5, periodoId: 2, clave: '01', maestroId: 1, cupoMaximo: 1,
      horario: [crearBloqueHorario('jueves', '09:00', '10:30')],
    },
    {
      id: 7, materiaId: 6, periodoId: 2, clave: '01', maestroId: 2, cupoMaximo: 30,
      horario: [crearBloqueHorario('viernes', '07:00', '08:30')],
    },
    {
      id: 8, materiaId: 7, periodoId: 2, clave: '01', maestroId: 2, cupoMaximo: 30,
      horario: [crearBloqueHorario('miercoles', '12:00', '13:30')],
    },
  ];

  private inscripciones: Inscripcion[] = [
    // 2026-1: el grupo 01 de Ana aun no tiene calificaciones; el 02 de Luis ya las tiene.
    { id: 1, alumnoId: 1, grupoId: 1, fechaRegistro: diasDesdeHoy(-170), estadoActual: 'activa', calificacion: null },
    { id: 2, alumnoId: 5, grupoId: 1, fechaRegistro: diasDesdeHoy(-170), estadoActual: 'activa', calificacion: null },
    { id: 3, alumnoId: 2, grupoId: 2, fechaRegistro: diasDesdeHoy(-170), estadoActual: 'activa', calificacion: 85 },
    { id: 4, alumnoId: 3, grupoId: 2, fechaRegistro: diasDesdeHoy(-170), estadoActual: 'activa', calificacion: 95 },
    // 2026-2: Juan ocupa el unico lugar de Estructuras de Datos.
    { id: 5, alumnoId: 2, grupoId: 6, fechaRegistro: new Date(), estadoActual: 'activa', calificacion: null },
  ];

  // Todos tienen pagada la inscripción del 2026-2 excepto Mario.
  private pagos: Pago[] = [
    this.pagoDeInscripcion(1, 1, 'pagado'),
    this.pagoDeInscripcion(2, 2, 'pagado'),
    this.pagoDeInscripcion(3, 3, 'pagado'),
    this.pagoDeInscripcion(4, 4, 'pagado'),
    this.pagoDeInscripcion(5, 5, 'pendiente'),
  ];

  private avisos: Aviso[] = [];

  // ACCESO

  async buscarUsuarioPorCorreo(correo: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.correoInstitucional === correo) ?? null;
  }

  async crearUsuario(datos: NuevoUsuario): Promise<Usuario> {
    const nuevo: Usuario = { id: siguienteId(this.usuarios), ...datos };
    this.usuarios.push(nuevo);
    return nuevo;
  }

  // PERSONAS

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

  async crearAlumno(datos: NuevoAlumno): Promise<Alumno> {
    const nuevo: Alumno = { id: siguienteId(this.alumnos), ...datos };
    this.alumnos.push(nuevo);
    return nuevo;
  }

  async crearMaestro(datos: NuevoMaestro): Promise<Maestro> {
    const nuevo: Maestro = { id: siguienteId(this.maestros), ...datos };
    this.maestros.push(nuevo);
    return nuevo;
  }

  async listarAlumnos(): Promise<Alumno[]> {
    return this.alumnos;
  }

  async listarMaestros(): Promise<Maestro[]> {
    return this.maestros;
  }

  // CATÁLOGO

  async listarCarreras(): Promise<Carrera[]> {
    return this.carreras;
  }

  async buscarCarreraPorId(id: number): Promise<Carrera | null> {
    return this.carreras.find((c) => c.id === id) ?? null;
  }

  async listarPlanesDeEstudio(): Promise<PlanDeEstudios[]> {
    return this.planes;
  }

  async buscarPlanDeEstudiosPorId(id: number): Promise<PlanDeEstudios | null> {
    return this.planes.find((p) => p.id === id) ?? null;
  }

  async actualizarPlanDeEstudios(plan: PlanDeEstudios): Promise<void> {
    const indice = this.planes.findIndex((p) => p.id === plan.id);
    if (indice !== -1) this.planes[indice] = plan;
  }

  async listarMaterias(): Promise<Materia[]> {
    return this.materias;
  }

  async buscarMateriaPorId(id: number): Promise<Materia | null> {
    return this.materias.find((m) => m.id === id) ?? null;
  }

  async buscarMateriaPorClave(clave: string): Promise<Materia | null> {
    return this.materias.find((m) => m.clave === clave) ?? null;
  }

  async crearMateria(datos: NuevaMateria): Promise<Materia> {
    const nueva: Materia = { id: siguienteId(this.materias), ...datos };
    this.materias.push(nueva);
    return nueva;
  }

  async buscarGrupoPorId(id: number): Promise<Grupo | null> {
    return this.grupos.find((g) => g.id === id) ?? null;
  }

  async listarGruposDeMateriaEnPeriodo(materiaId: number, periodoId: number): Promise<Grupo[]> {
    return this.grupos.filter((g) => g.materiaId === materiaId && g.periodoId === periodoId);
  }

  async listarGruposDeMaestro(maestroId: number): Promise<Grupo[]> {
    return this.grupos.filter((g) => g.maestroId === maestroId);
  }

  async listarGruposDePeriodo(periodoId: number): Promise<Grupo[]> {
    return this.grupos.filter((g) => g.periodoId === periodoId);
  }

  async crearGrupo(datos: NuevoGrupo): Promise<Grupo> {
    const nuevo: Grupo = { id: siguienteId(this.grupos), ...datos };
    this.grupos.push(nuevo);
    return nuevo;
  }

  // PERIODOS

  async listarPeriodos(): Promise<PeriodoEscolar[]> {
    return this.periodos;
  }

  async buscarPeriodoPorId(id: number): Promise<PeriodoEscolar | null> {
    return this.periodos.find((p) => p.id === id) ?? null;
  }

  async buscarPeriodoPorClave(clave: string): Promise<PeriodoEscolar | null> {
    return this.periodos.find((p) => p.clave === clave) ?? null;
  }

  async crearPeriodo(datos: NuevoPeriodo): Promise<PeriodoEscolar> {
    const nuevo: PeriodoEscolar = { id: siguienteId(this.periodos), ...datos };
    this.periodos.push(nuevo);
    return nuevo;
  }

  async buscarPeriodoConCargaAbierta(): Promise<PeriodoEscolar | null> {
    return this.periodos.find((p) => p.habilitado) ?? null;
  }

  async actualizarPeriodo(periodo: PeriodoEscolar): Promise<void> {
    const indice = this.periodos.findIndex((p) => p.id === periodo.id);
    if (indice !== -1) this.periodos[indice] = periodo;
  }

  // INSCRIPCIONES

  async buscarInscripcionPorId(id: number): Promise<Inscripcion | null> {
    return this.inscripciones.find((i) => i.id === id) ?? null;
  }

  async contarInscripcionesActivasDeGrupo(grupoId: number): Promise<number> {
    return this.inscripciones.filter((i) => i.grupoId === grupoId && i.estadoActual === 'activa').length;
  }

  async listarInscripcionesDeAlumno(alumnoId: number): Promise<Inscripcion[]> {
    return this.inscripciones.filter((i) => i.alumnoId === alumnoId);
  }

  async listarInscripcionesDeGrupo(grupoId: number): Promise<Inscripcion[]> {
    return this.inscripciones.filter((i) => i.grupoId === grupoId);
  }

  async crearInscripcion(datos: NuevaInscripcion): Promise<Inscripcion> {
    const nueva: Inscripcion = { id: siguienteId(this.inscripciones), ...datos };
    this.inscripciones.push(nueva);
    return nueva;
  }

  async actualizarInscripcion(inscripcion: Inscripcion): Promise<void> {
    const indice = this.inscripciones.findIndex((i) => i.id === inscripcion.id);
    if (indice !== -1) this.inscripciones[indice] = inscripcion;
  }

  // PAGOS

  async buscarPagoPorId(id: number): Promise<Pago | null> {
    return this.pagos.find((p) => p.id === id) ?? null;
  }

  async listarPagosDeAlumno(alumnoId: number): Promise<Pago[]> {
    return this.pagos.filter((p) => p.alumnoId === alumnoId);
  }

  async crearPago(datos: NuevoPago): Promise<Pago> {
    const nuevo: Pago = { id: siguienteId(this.pagos), ...datos };
    this.pagos.push(nuevo);
    return nuevo;
  }

  async actualizarPago(pago: Pago): Promise<void> {
    const indice = this.pagos.findIndex((p) => p.id === pago.id);
    if (indice !== -1) this.pagos[indice] = pago;
  }

  // AVISOS

  async listarAvisosDePeriodo(periodoId: number): Promise<Aviso[]> {
    return this.avisos.filter((a) => a.periodoId === periodoId);
  }

  async crearAviso(datos: NuevoAviso): Promise<Aviso> {
    const nuevo: Aviso = { id: siguienteId(this.avisos), ...datos };
    this.avisos.push(nuevo);
    return nuevo;
  }

  // AYUDANTES PARA DATOS DE PRUEBA

  private usuario(id: number, correo: string, rol: Usuario['rol'], personaId: number): Usuario {
    return { id, correoInstitucional: correo, contrasenaHash: generarHashSincrono(CONTRASENA_DE_PRUEBA), rol, personaId };
  }

  private pagoDeInscripcion(id: number, alumnoId: number, estado: Pago['estado']): Pago {
    return {
      id,
      alumnoId,
      periodoId: 2,
      concepto: 'inscripcion',
      monto: 2500,
      fechaLimite: diasDesdeHoy(10),
      estado,
      fechaPago: estado === 'pagado' ? diasDesdeHoy(-5) : null,
    };
  }
}
