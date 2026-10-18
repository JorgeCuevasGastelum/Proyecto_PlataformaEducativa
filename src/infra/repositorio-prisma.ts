import { Injectable } from '@nestjs/common';
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
} from '../dominio/entidades';
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
} from '../dominio/repositorio-academico';
import { PrismaService } from '../prisma/prisma.service';

function aUsuario(u: {
  id: number;
  correoInstitucional: string;
  contrasenaHash: string;
  rol: Usuario['rol'];
  alumnoId: number | null;
  maestroId: number | null;
  administradorId: number | null;
}): Usuario {
  const personaId = u.alumnoId ?? u.maestroId ?? u.administradorId ?? 0;
  return { id: u.id, correoInstitucional: u.correoInstitucional, contrasenaHash: u.contrasenaHash, rol: u.rol, personaId };
}

function aMateria(m: Omit<Materia, 'prerrequisitoIds'> & { prerrequisitos: { prerrequisitoId: number }[] }): Materia {
  return {
    id: m.id,
    clave: m.clave,
    nombre: m.nombre,
    descripcion: m.descripcion,
    creditos: m.creditos,
    prerrequisitoIds: m.prerrequisitos.map((p) => p.prerrequisitoId),
  };
}

function aPlan(p: Omit<PlanDeEstudios, 'materiaIds'> & { materias: { materiaId: number }[] }): PlanDeEstudios {
  return { id: p.id, clave: p.clave, carreraId: p.carreraId, materiaIds: p.materias.map((m) => m.materiaId) };
}

function aGrupo(g: Omit<Grupo, 'horario'> & { horario: Grupo['horario'] }): Grupo {
  return {
    id: g.id,
    materiaId: g.materiaId,
    periodoId: g.periodoId,
    clave: g.clave,
    maestroId: g.maestroId,
    cupoMaximo: g.cupoMaximo,
    horario: g.horario.map((b) => ({ diaSemana: b.diaSemana, minutoInicio: b.minutoInicio, minutoFin: b.minutoFin })),
  };
}

function aPago(p: Omit<Pago, 'monto'> & { monto: { toNumber(): number } }): Pago {
  return { ...p, monto: p.monto.toNumber() };
}

const conPrerrequisitos = { prerrequisitos: true } as const;
const conMaterias = { materias: true } as const;
const conHorario = { horario: true } as const;

@Injectable()
export class RepositorioPrisma implements RepositorioAcademico {
  constructor(private readonly prisma: PrismaService) {}

  // ACCESO

  async buscarUsuarioPorCorreo(correo: string): Promise<Usuario | null> {
    const u = await this.prisma.usuario.findUnique({ where: { correoInstitucional: correo } });
    return u ? aUsuario(u) : null;
  }

  async crearUsuario(datos: NuevoUsuario): Promise<Usuario> {
    const persona =
      datos.rol === 'alumno'
        ? { alumnoId: datos.personaId }
        : datos.rol === 'maestro'
          ? { maestroId: datos.personaId }
          : { administradorId: datos.personaId };
    const u = await this.prisma.usuario.create({
      data: { correoInstitucional: datos.correoInstitucional, contrasenaHash: datos.contrasenaHash, rol: datos.rol, ...persona },
    });
    return aUsuario(u);
  }

  // PERSONAS

  buscarAlumnoPorId(id: number): Promise<Alumno | null> {
    return this.prisma.alumno.findUnique({ where: { id } });
  }

  buscarAlumnoPorMatricula(matricula: string): Promise<Alumno | null> {
    return this.prisma.alumno.findUnique({ where: { matricula } });
  }

  buscarMaestroPorId(id: number): Promise<Maestro | null> {
    return this.prisma.maestro.findUnique({ where: { id } });
  }

  buscarMaestroPorNumeroEmpleado(numeroEmpleado: string): Promise<Maestro | null> {
    return this.prisma.maestro.findUnique({ where: { numeroEmpleado } });
  }

  buscarAdministradorPorId(id: number): Promise<Administrador | null> {
    return this.prisma.administrador.findUnique({ where: { id } });
  }

  crearAlumno(datos: NuevoAlumno): Promise<Alumno> {
    return this.prisma.alumno.create({ data: datos });
  }

  crearMaestro(datos: NuevoMaestro): Promise<Maestro> {
    return this.prisma.maestro.create({ data: datos });
  }

  listarAlumnos(): Promise<Alumno[]> {
    return this.prisma.alumno.findMany({ orderBy: { id: 'asc' } });
  }

  listarMaestros(): Promise<Maestro[]> {
    return this.prisma.maestro.findMany({ orderBy: { id: 'asc' } });
  }

  // CATÁLOGO

  listarCarreras(): Promise<Carrera[]> {
    return this.prisma.carrera.findMany({ orderBy: { id: 'asc' } });
  }

  buscarCarreraPorId(id: number): Promise<Carrera | null> {
    return this.prisma.carrera.findUnique({ where: { id } });
  }

  async listarPlanesDeEstudio(): Promise<PlanDeEstudios[]> {
    const planes = await this.prisma.planDeEstudios.findMany({ include: conMaterias, orderBy: { id: 'asc' } });
    return planes.map(aPlan);
  }

  async buscarPlanDeEstudiosPorId(id: number): Promise<PlanDeEstudios | null> {
    const p = await this.prisma.planDeEstudios.findUnique({ where: { id }, include: conMaterias });
    return p ? aPlan(p) : null;
  }

  async actualizarPlanDeEstudios(plan: PlanDeEstudios): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.materiaEnPlan.deleteMany({ where: { planId: plan.id } }),
      this.prisma.materiaEnPlan.createMany({ data: plan.materiaIds.map((materiaId) => ({ planId: plan.id, materiaId })) }),
    ]);
  }

  async listarMaterias(): Promise<Materia[]> {
    const materias = await this.prisma.materia.findMany({ include: conPrerrequisitos, orderBy: { id: 'asc' } });
    return materias.map(aMateria);
  }

  async buscarMateriaPorId(id: number): Promise<Materia | null> {
    const m = await this.prisma.materia.findUnique({ where: { id }, include: conPrerrequisitos });
    return m ? aMateria(m) : null;
  }

  async buscarMateriaPorClave(clave: string): Promise<Materia | null> {
    const m = await this.prisma.materia.findUnique({ where: { clave }, include: conPrerrequisitos });
    return m ? aMateria(m) : null;
  }

  async crearMateria(datos: NuevaMateria): Promise<Materia> {
    const { prerrequisitoIds, ...materia } = datos;
    const m = await this.prisma.materia.create({
      data: { ...materia, prerrequisitos: { create: prerrequisitoIds.map((prerrequisitoId) => ({ prerrequisitoId })) } },
      include: conPrerrequisitos,
    });
    return aMateria(m);
  }

  async buscarGrupoPorId(id: number): Promise<Grupo | null> {
    const g = await this.prisma.grupo.findUnique({ where: { id }, include: conHorario });
    return g ? aGrupo(g) : null;
  }

  async listarGruposDeMateriaEnPeriodo(materiaId: number, periodoId: number): Promise<Grupo[]> {
    const grupos = await this.prisma.grupo.findMany({ where: { materiaId, periodoId }, include: conHorario });
    return grupos.map(aGrupo);
  }

  async listarGruposDeMaestro(maestroId: number): Promise<Grupo[]> {
    const grupos = await this.prisma.grupo.findMany({ where: { maestroId }, include: conHorario, orderBy: { id: 'asc' } });
    return grupos.map(aGrupo);
  }

  async listarGruposDePeriodo(periodoId: number): Promise<Grupo[]> {
    const grupos = await this.prisma.grupo.findMany({ where: { periodoId }, include: conHorario, orderBy: { id: 'asc' } });
    return grupos.map(aGrupo);
  }

  async crearGrupo(datos: NuevoGrupo): Promise<Grupo> {
    const { horario, ...grupo } = datos;
    const g = await this.prisma.grupo.create({
      data: { ...grupo, horario: { create: horario } },
      include: conHorario,
    });
    return aGrupo(g);
  }

  // PERIODOS

  listarPeriodos(): Promise<PeriodoEscolar[]> {
    return this.prisma.periodoEscolar.findMany({ orderBy: { fechaAperturaCarga: 'asc' } });
  }

  buscarPeriodoPorId(id: number): Promise<PeriodoEscolar | null> {
    return this.prisma.periodoEscolar.findUnique({ where: { id } });
  }

  buscarPeriodoPorClave(clave: string): Promise<PeriodoEscolar | null> {
    return this.prisma.periodoEscolar.findUnique({ where: { clave } });
  }

  buscarPeriodoConCargaAbierta(): Promise<PeriodoEscolar | null> {
    return this.prisma.periodoEscolar.findFirst({ where: { habilitado: true } });
  }

  crearPeriodo(datos: NuevoPeriodo): Promise<PeriodoEscolar> {
    return this.prisma.periodoEscolar.create({ data: datos });
  }

  async actualizarPeriodo(periodo: PeriodoEscolar): Promise<void> {
    const { id, ...datos } = periodo;
    await this.prisma.periodoEscolar.update({ where: { id }, data: datos });
  }

  // INSCRIPCIONES

  buscarInscripcionPorId(id: number): Promise<Inscripcion | null> {
    return this.prisma.inscripcion.findUnique({ where: { id } });
  }

  contarInscripcionesActivasDeGrupo(grupoId: number): Promise<number> {
    return this.prisma.inscripcion.count({ where: { grupoId, estadoActual: 'activa' } });
  }

  listarInscripcionesDeAlumno(alumnoId: number): Promise<Inscripcion[]> {
    return this.prisma.inscripcion.findMany({ where: { alumnoId }, orderBy: { id: 'asc' } });
  }

  listarInscripcionesDeGrupo(grupoId: number): Promise<Inscripcion[]> {
    return this.prisma.inscripcion.findMany({ where: { grupoId }, orderBy: { id: 'asc' } });
  }

  crearInscripcion(datos: NuevaInscripcion): Promise<Inscripcion> {
    return this.prisma.inscripcion.create({ data: datos });
  }

  async actualizarInscripcion(inscripcion: Inscripcion): Promise<void> {
    const { id, ...datos } = inscripcion;
    await this.prisma.inscripcion.update({ where: { id }, data: datos });
  }

  // PAGOS

  async buscarPagoPorId(id: number): Promise<Pago | null> {
    const p = await this.prisma.pago.findUnique({ where: { id } });
    return p ? aPago(p) : null;
  }

  async listarPagosDeAlumno(alumnoId: number): Promise<Pago[]> {
    const pagos = await this.prisma.pago.findMany({ where: { alumnoId }, orderBy: { id: 'asc' } });
    return pagos.map(aPago);
  }

  async crearPago(datos: NuevoPago): Promise<Pago> {
    return aPago(await this.prisma.pago.create({ data: datos }));
  }

  async actualizarPago(pago: Pago): Promise<void> {
    const { id, ...datos } = pago;
    await this.prisma.pago.update({ where: { id }, data: datos });
  }

  // AVISOS

  listarAvisosDePeriodo(periodoId: number): Promise<Aviso[]> {
    return this.prisma.aviso.findMany({ where: { periodoId }, orderBy: { fechaPublicacion: 'desc' } });
  }

  crearAviso(datos: NuevoAviso): Promise<Aviso> {
    return this.prisma.aviso.create({ data: datos });
  }
}
