import { pedir } from '../compartido/servicios/api';
import type { RespuestaDeLogin, Sesion, SesionDelServicio } from '../compartido/tipos';

export async function entrar(correo: string, contrasena: string): Promise<Sesion> {
  const login = await pedir<RespuestaDeLogin>('post', '/auth/login', {
    correoInstitucional: correo,
    contrasena,
  });

  localStorage.setItem('token', login.access_token);
  try {
    const yo = await pedir<SesionDelServicio>('get', '/auth/yo');
    return { token: login.access_token, usuario: { correo, rol: yo.rol, personaId: yo.personaId } };
  } catch (e) {
    localStorage.removeItem('token');
    throw e;
  }
}