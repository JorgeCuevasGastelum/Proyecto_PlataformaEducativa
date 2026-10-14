import { LONGITUD_MINIMA_CONTRASENA } from './entidades.js';
import type { Alumno, Maestro, Rol } from './entidades.js';
import type { RepositorioAcademico } from './repositorio-academico.js';
import type { GeneradorDeHash } from './generador-de-hash.js';
import { AlumnoInvalidoError, MatriculaDuplicadaError, PlanDeEstudiosNoEncontradoError, MaestroInvalidoError, NumeroEmpleadoDuplicadoError, CorreoDuplicadoError, ContrasenaDebilError } from './errores.js';

export interface DatosNuevoAlumno {
  matricula: string;
  nombre: string;
  correoInstitucional: string;
  contrasena: string;
  planDeEstudiosId: number;
}

export interface DatosNuevoMaestro {
  numeroEmpleado: string;
  nombre: string;
  correoInstitucional: string;
  contrasena: string;
}

// La política de acceso pertenece al caso de uso que llama a este servicio.
// Hoy solo ServicioAdministracion lo expone; no existe una ruta pública de autorregistro.
export class ServicioRegistro {
  constructor(private readonly repo: RepositorioAcademico, private readonly hash: GeneradorDeHash) {}
  // RN-12
  async registrarAlumno(datos: DatosNuevoAlumno): Promise<Alumno> {
    if (!datos.matricula || !datos.nombre || !datos.correoInstitucional) {
      throw new AlumnoInvalidoError('faltan datos obligatorios');
    }

    const plan = await this.repo.buscarPlanDeEstudiosPorId(datos.planDeEstudiosId);
    if (!plan) throw new PlanDeEstudiosNoEncontradoError(String(datos.planDeEstudiosId));

    const existente = await this.repo.buscarAlumnoPorMatricula(datos.matricula);
    if (existente) throw new MatriculaDuplicadaError(datos.matricula);

    const { correo, contrasenaHash } = await this.prepararCuenta(datos.correoInstitucional, datos.contrasena);

    const alumno = await this.repo.crearAlumno({
      matricula: datos.matricula,
      nombre: datos.nombre,
      planDeEstudiosId: plan.id,
    });
    await this.crearUsuario(correo, contrasenaHash, 'alumno', alumno.id);
    return alumno;
  }

  // RN-13
  async registrarMaestro(datos: DatosNuevoMaestro): Promise<Maestro> {
    if (!datos.numeroEmpleado || !datos.nombre || !datos.correoInstitucional) {
      throw new MaestroInvalidoError('faltan datos obligatorios');
    }

    const existente = await this.repo.buscarMaestroPorNumeroEmpleado(datos.numeroEmpleado);
    if (existente) throw new NumeroEmpleadoDuplicadoError(datos.numeroEmpleado);

    const { correo, contrasenaHash } = await this.prepararCuenta(datos.correoInstitucional, datos.contrasena);

    const maestro = await this.repo.crearMaestro({ numeroEmpleado: datos.numeroEmpleado, nombre: datos.nombre });
    await this.crearUsuario(correo, contrasenaHash, 'maestro', maestro.id);
    return maestro;
  }

  // RN-20
  private async prepararCuenta(correo: string, contrasena: string): Promise<{ correo: string; contrasenaHash: string }> {
    const correoNormalizado = correo.trim().toLowerCase();
    const existente = await this.repo.buscarUsuarioPorCorreo(correoNormalizado);
    if (existente) throw new CorreoDuplicadoError(correoNormalizado);

    if (contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
      throw new ContrasenaDebilError(LONGITUD_MINIMA_CONTRASENA);
    }

    return { correo: correoNormalizado, contrasenaHash: await this.hash.generar(contrasena) };
  }

  private async crearUsuario(correo: string, contrasenaHash: string, rol: Rol, personaId: number): Promise<void> {
    await this.repo.crearUsuario({ correoInstitucional: correo, contrasenaHash, rol, personaId });
  }
}
