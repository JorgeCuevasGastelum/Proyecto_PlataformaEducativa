import type { Prisma, PrismaClient } from '@prisma/client';
import type { RepositorioAcademico, NuevoUsuario, NuevoAlumno, NuevoMaestro, NuevaMateria, NuevoGrupo, NuevaInscripcion, NuevoPago, NuevoAviso } from '../dominio/repositorio-academico.js';
import type { Usuario, PlanDeEstudios, PeriodoEscolar, Inscripcion, Pago } from '../dominio/entidades.js';

type Cliente = Prisma.TransactionClient | PrismaClient;
const materiaInclude = { prerrequisitos: true } as const;
const grupoInclude = { horario: true } as const;
const planInclude = { materias: true } as const;
type MateriaDB = Prisma.MateriaGetPayload<{ include: typeof materiaInclude }>;
type GrupoDB = Prisma.GrupoGetPayload<{ include: typeof grupoInclude }>;
type PlanDB = Prisma.PlanDeEstudiosGetPayload<{ include: typeof planInclude }>;
const materia = (m: MateriaDB) => ({ id: m.id, clave: m.clave, nombre: m.nombre, descripcion: m.descripcion, creditos: m.creditos, prerrequisitoIds: m.prerrequisitos.map(p => p.prerrequisitoId) });
const grupo = (g: GrupoDB) => ({ id: g.id, materiaId: g.materiaId, periodoId: g.periodoId, clave: g.clave, maestroId: g.maestroId, cupoMaximo: g.cupoMaximo, horario: g.horario.map(h => ({ diaSemana: h.diaSemana, minutoInicio: h.minutoInicio, minutoFin: h.minutoFin })) });
const plan = (p: PlanDB) => ({ id: p.id, clave: p.clave, carreraId: p.carreraId, materiaIds: p.materias.map(m => m.materiaId) });
const pago = (p: Prisma.PagoGetPayload<object>) => ({ ...p, monto: Number(p.monto) });
function usuario(u: Prisma.UsuarioGetPayload<object>): Usuario {
  const personaId = u.rol === 'alumno' ? u.alumnoId : u.rol === 'maestro' ? u.maestroId : u.administradorId;
  if (personaId === null) throw new Error('Cuenta sin persona asociada.');
  return { id: u.id, correoInstitucional: u.correoInstitucional, contrasenaHash: u.contrasenaHash, rol: u.rol, personaId };
}

/** El mismo contrato del avance 1. No expone tipos de Prisma al dominio. */
export class RepositorioPrisma implements RepositorioAcademico {
  constructor(private readonly db: Cliente) {}
  async buscarUsuarioPorCorreo(correo: string) {
    const u = await this.db.usuario.findUnique({ where: { correoInstitucional: correo } });
    return u ? usuario(u) : null;
  }
  async crearUsuario({ personaId, ...datos }: NuevoUsuario) {
    const relacion = datos.rol === 'alumno' ? { alumnoId: personaId } : datos.rol === 'maestro' ? { maestroId: personaId } : { administradorId: personaId };
    return usuario(await this.db.usuario.create({ data: { ...datos, ...relacion } }));
  }
  buscarAlumnoPorId(id: number) { return this.db.alumno.findUnique({ where: { id } }); }
  buscarAlumnoPorMatricula(matricula: string) { return this.db.alumno.findUnique({ where: { matricula } }); }
  buscarMaestroPorId(id: number) { return this.db.maestro.findUnique({ where: { id } }); }
  buscarMaestroPorNumeroEmpleado(numeroEmpleado: string) { return this.db.maestro.findUnique({ where: { numeroEmpleado } }); }
  buscarAdministradorPorId(id: number) { return this.db.administrador.findUnique({ where: { id } }); }
  crearAlumno(data: NuevoAlumno) { return this.db.alumno.create({ data }); }
  crearMaestro(data: NuevoMaestro) { return this.db.maestro.create({ data }); }
  buscarCarreraPorId(id: number) { return this.db.carrera.findUnique({ where: { id } }); }
  async buscarPlanDeEstudiosPorId(id: number) {
    const p = await this.db.planDeEstudios.findUnique({ where: { id }, include: planInclude });
    return p ? plan(p) : null;
  }
  async actualizarPlanDeEstudios({ id, materiaIds }: PlanDeEstudios) {
    await this.db.planDeEstudios.update({ where: { id }, data: { materias: { deleteMany: {}, create: materiaIds.map(materiaId => ({ materiaId })) } } });
  }
  async buscarMateriaPorId(id: number) {
    const m = await this.db.materia.findUnique({ where: { id }, include: materiaInclude });
    return m ? materia(m) : null;
  }
  async buscarMateriaPorClave(clave: string) {
    const m = await this.db.materia.findUnique({ where: { clave }, include: materiaInclude });
    return m ? materia(m) : null;
  }
  async crearMateria({ prerrequisitoIds, ...data }: NuevaMateria) {
    return materia(await this.db.materia.create({ data: { ...data, prerrequisitos: { create: prerrequisitoIds.map(prerrequisitoId => ({ prerrequisitoId })) } }, include: materiaInclude }));
  }
  async buscarGrupoPorId(id: number) {
    const g = await this.db.grupo.findUnique({ where: { id }, include: grupoInclude });
    return g ? grupo(g) : null;
  }
  async listarGruposDeMateriaEnPeriodo(materiaId: number, periodoId: number) {
    return (await this.db.grupo.findMany({ where: { materiaId, periodoId }, include: grupoInclude, orderBy: { id: 'asc' } })).map(grupo);
  }
  async listarGruposDeMaestro(maestroId: number) {
    return (await this.db.grupo.findMany({ where: { maestroId }, include: grupoInclude, orderBy: { id: 'asc' } })).map(grupo);
  }
  async crearGrupo({ horario, ...data }: NuevoGrupo) {
    return grupo(await this.db.grupo.create({ data: { ...data, horario: { create: horario } }, include: grupoInclude }));
  }
  buscarPeriodoPorId(id: number) { return this.db.periodoEscolar.findUnique({ where: { id } }); }
  buscarPeriodoConCargaAbierta() { return this.db.periodoEscolar.findFirst({ where: { habilitado: true }, orderBy: { id: 'asc' } }); }
  async actualizarPeriodo({ id, ...data }: PeriodoEscolar) { await this.db.periodoEscolar.update({ where: { id }, data }); }
  buscarInscripcionPorId(id: number) { return this.db.inscripcion.findUnique({ where: { id } }); }
  contarInscripcionesActivasDeGrupo(grupoId: number) { return this.db.inscripcion.count({ where: { grupoId, estadoActual: 'activa' } }); }
  listarInscripcionesDeAlumno(alumnoId: number) { return this.db.inscripcion.findMany({ where: { alumnoId }, orderBy: { id: 'asc' } }); }
  listarInscripcionesDeGrupo(grupoId: number) { return this.db.inscripcion.findMany({ where: { grupoId }, orderBy: { id: 'asc' } }); }
  crearInscripcion(data: NuevaInscripcion) { return this.db.inscripcion.create({ data }); }
  async actualizarInscripcion({ id, ...data }: Inscripcion) { await this.db.inscripcion.update({ where: { id }, data }); }
  async buscarPagoPorId(id: number) {
    const p = await this.db.pago.findUnique({ where: { id } });
    return p ? pago(p) : null;
  }
  async listarPagosDeAlumno(alumnoId: number) { return (await this.db.pago.findMany({ where: { alumnoId }, orderBy: { id: 'asc' } })).map(pago); }
  async crearPago(data: NuevoPago) { return pago(await this.db.pago.create({ data })); }
  async actualizarPago({ id, ...data }: Pago) { await this.db.pago.update({ where: { id }, data }); }
  listarAvisosDePeriodo(periodoId: number) { return this.db.aviso.findMany({ where: { periodoId }, orderBy: { id: 'asc' } }); }
  crearAviso(data: NuevoAviso) { return this.db.aviso.create({ data }); }

  // Consultas de catálogo para la API; no cambian el contrato del dominio.
  listarCarreras() { return this.db.carrera.findMany({ orderBy: { id: 'asc' } }); }
  async listarPlanes() { return (await this.db.planDeEstudios.findMany({ include: planInclude, orderBy: { id: 'asc' } })).map(plan); }
  async listarMaterias() { return (await this.db.materia.findMany({ include: materiaInclude, orderBy: { id: 'asc' } })).map(materia); }
  async listarGrupos(periodoId?: number) { return (await this.db.grupo.findMany({ where: { periodoId }, include: grupoInclude, orderBy: { id: 'asc' } })).map(grupo); }
  listarPeriodos() { return this.db.periodoEscolar.findMany({ orderBy: { id: 'asc' } }); }
  listarAlumnos() { return this.db.alumno.findMany({ orderBy: { id: 'asc' } }); }
  listarMaestros() { return this.db.maestro.findMany({ orderBy: { id: 'asc' } }); }
}
