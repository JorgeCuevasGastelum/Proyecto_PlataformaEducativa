// Traduce un error HTTP a una frase que se le puede mostrar al administrador.
// Es la misma tabla de gimnasio-admin.

import { HttpErrorResponse } from '@angular/common/http';

export function mensajeDeApi(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Algo falló y no fue la red. Revisa la consola.';
  }

  // status 0 = la petición nunca llegó: el servicio está apagado, o CORS la bloqueó.
  if (error.status === 0) {
    return 'No se pudo contactar el servicio. Revisa que esté encendido.';
  }

  const delServidor = mensajesDelCuerpo(error.error).join('. ') || null;

  switch (error.status) {
    case 400:
      return delServidor ?? 'Los datos que mandaste no son válidos.';
    case 401:
      if (delServidor && delServidor !== 'Unauthorized') return delServidor;
      return 'Tu sesión no es válida o venció. Vuelve a entrar.';
    case 403:
      return 'Tu cuenta no tiene permiso para hacer esto.';
    case 404:
      return delServidor ?? 'Eso ya no existe.';
    default:
      return error.status >= 500
        ? 'El servicio tuvo un problema. Inténtalo de nuevo.'
        : (delServidor ?? `Error ${error.status}.`);
  }
}

// El ValidationPipe de Nest manda `message` como arreglo y los demás errores como texto.
export function mensajesDelCuerpo(cuerpo: unknown): string[] {
  if (!cuerpo || typeof cuerpo !== 'object') return [];
  const m = (cuerpo as { message?: unknown }).message;
  if (typeof m === 'string') return [m];
  if (Array.isArray(m)) return m.map(String);
  return [];
}
