import axios from 'axios';

export const URL_API: string | undefined = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: URL_API,
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Sobre<T> {
  data: T;
}

type Metodo = 'get' | 'post' | 'put' | 'patch' | 'delete';

export async function pedir<T>(metodo: Metodo, ruta: string, cuerpo?: unknown): Promise<T> {
  const respuesta = await api.request<Sobre<T>>({ method: metodo, url: ruta, data: cuerpo });
  return respuesta.data.data;
}

export function mensajeDeError(e: unknown, generico: string): string {
  if (!axios.isAxiosError(e)) return generico;

  if (!e.response) {
    return 'No pudimos comunicarnos con el servicio. Revisa que esté encendido y vuelve a intentar.';
  }

  const estado = e.response.status;
  const detalle = e.response.data?.error;
  const esDeDominio = typeof detalle?.tipo === 'string' && detalle.tipo.endsWith('Error');
  const hayTexto = typeof detalle?.mensaje === 'string';

  if (estado === 401) {
    if (e.config?.url === '/auth/login' && hayTexto) return detalle.mensaje;
    return 'Tu sesión terminó. Vuelve a entrar.';
  }
  if (estado === 400) return 'El servicio no aceptó los datos enviados. Revisa lo que escribiste.';
  if ((estado === 403 || estado === 404 || estado === 409) && esDeDominio && hayTexto) {
    return detalle.mensaje;
  }
  if (estado === 403) return 'Tu cuenta no tiene permiso para hacer esto.';
  if (estado === 404) return 'No encontramos lo que buscabas.';
  return generico;
}

export function estadoDeError(e: unknown): number | undefined {
  if (axios.isAxiosError(e)) {
    return e.response?.status;
  }
  return undefined;
}

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const rutaDeLogin = error.config?.url === '/auth/login';
    if (axios.isAxiosError(error) && error.response?.status === 401 && !rutaDeLogin && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.dispatchEvent(new Event('sesion-terminada'));
    }

    return Promise.reject(error);
  }
);