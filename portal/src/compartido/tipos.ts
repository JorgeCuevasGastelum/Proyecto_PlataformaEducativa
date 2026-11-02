export type Rol = 'alumno' | 'maestro' | 'administrador';

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

export type ConceptoDePago = 'inscripcion' | 'colegiatura';

export type EstadoDePago = 'pendiente' | 'pagado';

export interface RespuestaDeLogin {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SesionDelServicio {
  usuarioId: number;
  rol: Rol;
  personaId: number;
}

export interface BloqueHorario {
  diaSemana: DiaSemana;
  minutoInicio: number;
  minutoFin: number;
}

export interface PeriodoEscolar {
  id: number;
  clave: string;
  fechaAperturaCarga: string;
  fechaCierreCarga: string;
  creditosMaximos: number;
  habilitado: boolean;
}

export interface Materia {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  prerrequisitoIds: number[];
}

export interface PlanDeEstudios {
  id: number;
  clave: string;
  carreraId: number;
  materiaIds: number[];
}

export interface GrupoDeCatalogo {
  grupoId: number;
  grupoClave: string;
  materiaId: number;
  materiaClave: string;
  materiaNombre: string;
  creditos: number;
  maestroNombre: string;
  periodoClave: string;
  cupoMaximo: number;
  disponibles: number;
  horario: BloqueHorario[];
}

export interface Inscripcion {
  id: number;
  alumnoId: number;
  grupoId: number;
  fechaRegistro: string;
  estadoActual: 'activa' | 'baja';
  calificacion: number | null;
}

export interface MateriaInscrita {
  inscripcionId: number;
  materiaClave: string;
  materiaNombre: string;
  grupoClave: string;
  creditos: number;
}

export interface RenglonDeHorario {
  diaSemana: DiaSemana;
  minutoInicio: number;
  minutoFin: number;
  materiaNombre: string;
  grupoClave: string;
  maestroNombre: string;
}

export interface MateriaCursada {
  materiaClave: string;
  materiaNombre: string;
  creditos: number;
  grupoClave: string;
  calificacion: number | null;
  aprobada: boolean | null;
}

export interface Historial {
  periodoClave: string;
  materias: MateriaCursada[];
}

export interface Pago {
  id: number;
  alumnoId: number;
  periodoId: number;
  concepto: ConceptoDePago;
  monto: number;
  fechaLimite: string;
  estado: EstadoDePago;
  fechaPago: string | null;
}

export interface Aviso {
  id: number;
  titulo: string;
  contenido: string;
  periodoId: number;
  fechaPublicacion: string;
}

export interface GrupoDelMaestro {
  grupoId: number;
  grupoClave: string;
  materiaNombre: string;
  periodoClave: string;
  inscritos: number;
}

export interface AlumnoEnLista {
  inscripcionId: number;
  matricula: string;
  nombre: string;
  calificacion: number | null;
}

export interface CapturaDeCalificacion {
  inscripcionId: number;
  calificacion: number;
}

export interface Usuario {
  correo: string;
  rol: Rol;
  personaId: number;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}