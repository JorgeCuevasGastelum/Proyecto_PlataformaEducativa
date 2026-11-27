import type { Sesion } from './entidades.js';
import { CredencialesInvalidasError } from './errores.js';
import type { GeneradorDeHash } from './generador-de-hash.js';
import type { RepositorioAcademico } from './repositorio-academico.js';

export class ServicioAutenticacion {
  constructor(
    private readonly repo: RepositorioAcademico,
    private readonly hash: GeneradorDeHash,
  ) {}

  // RN-19. Se responde el mismo error si el correo no existe o si la contraseña no coincide,
  // para no revelar que correos tienen cuenta.
  async iniciarSesion(correo: string, contrasena: string): Promise<Sesion> {
    const usuario = await this.repo.buscarUsuarioPorCorreo(correo.trim().toLowerCase());
    if (!usuario) throw new CredencialesInvalidasError();

    const coincide = await this.hash.coincide(contrasena, usuario.contrasenaHash);
    if (!coincide) throw new CredencialesInvalidasError();

    return { usuarioId: usuario.id, rol: usuario.rol, personaId: usuario.personaId };
  }
}
